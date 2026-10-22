#!/bin/bash
#
# Backup Manager - запуск резервного копирования настроенных каталогов
#

set -euo pipefail

CONFIG_FILE="/etc/redos-backup-manager/backup.conf"
LOG_FILE="/var/log/redos-backup/backup.log"
BACKUP_SCRIPT="/usr/share/redos-backup-manager/scripts/backup.sh"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP-ALL] $1" >> "$LOG_FILE"
}

# Загрузка конфигурации
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    log "ОШИБКА: Файл конфигурации не найден: $CONFIG_FILE"
    exit 1
fi

log "Начало выполнения всех заданий резервного копирования"

# Проверка SMB подключения
/usr/share/redos-backup-manager/scripts/mount-smb.sh
if [ $? -ne 0 ]; then
    log "ОШИБКА: Не удалось подключиться к SMB серверу. Задания не выполнены."
    exit 1
fi

# Подсчёт результатов
TOTAL=0
SUCCESS=0
FAILED=0

# Выполнение резервного копирования каждого каталога
for dir in $BACKUP_DIRS; do
    SOURCE_PATH="$USER_HOME/$dir"
    JOB_NAME="$dir"
    
    if [ -d "$SOURCE_PATH" ]; then
        TOTAL=$((TOTAL + 1))
        log "Запуск: $JOB_NAME ($SOURCE_PATH)"
        
        if "$BACKUP_SCRIPT" "$SOURCE_PATH" "$JOB_NAME"; then
            SUCCESS=$((SUCCESS + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    else
        log "ПРОПУСК: Каталог не существует: $SOURCE_PATH"
    fi
done

log "Результат: Всего=$TOTAL, Успешно=$SUCCESS, Ошибок=$FAILED"

if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
