#!/bin/bash
#
# Backup Manager - резервное копирование каталога на SMB сервер
#
# Использование:
#   backup.sh [КАТАЛОГ_ИСТОЧНИК] [ИМЯ_ЗАДАНИЯ]
#
# Пример:
#   backup.sh /home/user/Документы "Документы"
#

set -euo pipefail

# ==========================================
# Конфигурация
# ==========================================
CONFIG_FILE="/etc/redos-backup-manager/backup.conf"
LOG_FILE="/var/log/redos-backup/backup.log"
LOCK_DIR="/var/run/redos-backup"

# Загрузка конфигурации
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ОШИБКА: Файл конфигурации не найден: $CONFIG_FILE" >> "$LOG_FILE"
    exit 1
fi

# Параметры по умолчанию
SOURCE_DIR="${1:-}"
JOB_NAME="${2:-без имени}"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-60}"
BANDWIDTH_LIMIT="${BANDWIDTH_LIMIT:-0}"
COMPRESSION="${COMPRESSION:-true}"
DELETE_EXTRA="${DELETE_EXTRA:-true}"
VERBOSE="${VERBOSE:-false}"

# ==========================================
# Функции
# ==========================================

log() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [$JOB_NAME] $message" >> "$LOG_FILE"
    if [ "$VERBOSE" = "true" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message"
    fi
}

check_lock() {
    local lock_file="$LOCK_DIR/backup_${JOB_NAME// /_}.lock"
    if [ -f "$lock_file" ]; then
        local pid=$(cat "$lock_file")
        if kill -0 "$pid" 2>/dev/null; then
            log "WARNING" "Резервное копирование уже выполняется (PID: $pid)"
            exit 1
        else
            rm -f "$lock_file"
        fi
    fi
    mkdir -p "$LOCK_DIR"
    echo $$ > "$lock_file"
    trap "rm -f $lock_file" EXIT
}

check_smb_mount() {
    if ! mountpoint -q "$MOUNT_POINT" 2>/dev/null; then
        log "INFO" "SMB ресурс не смонтирован. Попытка монтирования..."
        if ! /usr/share/redos-backup-manager/scripts/mount-smb.sh; then
            log "ERROR" "Не удалось смонтировать SMB ресурс: //$SMB_SERVER/$SMB_SHARE"
            return 1
        fi
        log "INFO" "SMB ресурс успешно смонтирован"
    fi
    
    # Проверка доступности
    if [ ! -d "$MOUNT_POINT" ] || [ ! -w "$MOUNT_POINT" ]; then
        log "ERROR" "Точка монтирования недоступна или недоступна для записи: $MOUNT_POINT"
        return 1
    fi
    
    return 0
}

build_rsync_opts() {
    local opts="-a --progress --stats"
    
    # Сжатие
    if [ "$COMPRESSION" = "true" ]; then
        opts="$opts -z"
    fi
    
    # Удаление лишних файлов
    if [ "$DELETE_EXTRA" = "true" ]; then
        opts="$opts --delete"
    fi
    
    # Ограничение полосы пропускания
    if [ "$BANDWIDTH_LIMIT" -gt 0 ] 2>/dev/null; then
        opts="$opts --bwlimit=${BANDWIDTH_LIMIT}"
    fi
    
    # Исключения
    if [ -n "${EXCLUDE_PATTERNS:-}" ]; then
        for pattern in $EXCLUDE_PATTERNS; do
            opts="$opts --exclude=$pattern"
        done
    fi
    
    # Файл журнала rsync
    opts="$opts --log-file=/var/log/redos-backup/rsync.log"
    
    echo "$opts"
}

send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "${NOTIFY_EMAIL:-}" ] && command -v mail &>/dev/null; then
        echo "$message" | mail -s "[Backup Manager] $status: $JOB_NAME" "$NOTIFY_EMAIL" 2>/dev/null || true
    fi
}

# ==========================================
# Основная логика
# ==========================================

# Проверка аргументов
if [ -z "$SOURCE_DIR" ]; then
    log "ERROR" "Не указан каталог-источник"
    echo "Использование: $0 <каталог-источник> [имя задания]"
    exit 1
fi

# Проверка существования источника
if [ ! -d "$SOURCE_DIR" ]; then
    log "ERROR" "Каталог-источник не существует: $SOURCE_DIR"
    exit 1
fi

# Проверка блокировки
check_lock

log "INFO" "Начало резервного копирования: $SOURCE_DIR → $MOUNT_POINT/"

# Проверка SMB подключения
if ! check_smb_mount; then
    send_notification "ОШИБКА" "Не удалось подключиться к SMB серверу"
    exit 1
fi

# Формирование пути назначения
DEST_DIR="$MOUNT_POINT/$(basename "$SOURCE_DIR")"
if ! mkdir -p "$DEST_DIR"; then
    log "ERROR" "Не удалось создать каталог назначения: $DEST_DIR"
    exit 1
fi

# Построение опций rsync
RSYNC_OPTS=$(build_rsync_opts)

# Выполнение с повторными попытками
ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ]; do
    ATTEMPT=$((ATTEMPT + 1))
    log "INFO" "Попытка $ATTEMPT из $MAX_RETRIES..."
    
    if eval rsync $RSYNC_OPTS "$SOURCE_DIR/" "$DEST_DIR/" 2>&1 | while read line; do
        log "INFO" "rsync: $line"
    done; then
        SUCCESS=true
        break
    else
        log "WARNING" "Попытка $ATTEMPT не удалась"
        if [ $ATTEMPT -lt $MAX_RETRIES ]; then
            log "INFO" "Ожидание ${RETRY_DELAY}с перед повторной попыткой..."
            sleep "$RETRY_DELAY"
        fi
    fi
done

# Результат
if [ "$SUCCESS" = true ]; then
    # Подсчёт скопированных данных
    COPIED_SIZE=$(du -sh "$DEST_DIR" 2>/dev/null | cut -f1)
    COPIED_FILES=$(find "$DEST_DIR" -type f 2>/dev/null | wc -l)
    
    log "SUCCESS" "Резервное копирование завершено успешно. Размер: $COPIED_SIZE, Файлов: $COPIED_FILES"
    send_notification "УСПЕХ" "Резервное копирование \"$JOB_NAME\" завершено успешно.\nРазмер: $COPIED_SIZE\nФайлов: $COPIED_FILES"
    exit 0
else
    log "ERROR" "Резервное копирование не удалось после $MAX_RETRIES попыток"
    send_notification "ОШИБКА" "Резервное копирование \"$JOB_NAME\" не удалось после $MAX_RETRIES попыток"
    exit 1
fi
