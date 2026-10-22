#!/bin/bash
#
# РЕД ОС - Система резервного копирования
# Скрипт монтирования SMB/CIFS ресурса
#

set -euo pipefail

CONFIG_FILE="/etc/redos-backup-manager/backup.conf"
LOG_FILE="/var/log/redos-backup/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MOUNT] $1" >> "$LOG_FILE"
}

# Загрузка конфигурации
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "ОШИБКА: Файл конфигурации не найден: $CONFIG_FILE" >&2
    exit 1
fi

# Проверка наличия необходимых пакетов
for pkg in cifs-utils samba-client; do
    if ! rpm -q "$pkg" &>/dev/null; then
        log "Установка недостающего пакета: $pkg"
        dnf install -y "$pkg"
    fi
done

# Создание точки монтирования
mkdir -p "$MOUNT_POINT"

# Создание файла учётных данных
CREDENTIALS_FILE="/etc/redos-backup-manager/smb-credentials"
cat > "$CREDENTIALS_FILE" << EOF
username=$SMB_USERNAME
password=$SMB_PASSWORD
domain=$SMB_DOMAIN
EOF
chmod 600 "$CREDENTIALS_FILE"

# Проверка, не смонтировано ли уже
if mountpoint -q "$MOUNT_POINT" 2>/dev/null; then
    log "Ресурс уже смонтирован: //$SMB_SERVER/$SMB_SHARE → $MOUNT_POINT"
    exit 0
fi

# Монтирование
MOUNT_OPTS="credentials=$CREDENTIALS_FILE,iocharset=utf8,file_mode=0700,dir_mode=0700,_netdev,nofail"

# Дополнительные опции
if [ -n "${SMB_VERSION:-}" ]; then
    MOUNT_OPTS="$MOUNT_OPTS,vers=$SMB_VERSION"
fi

log "Монтирование //$SMB_SERVER/$SMB_SHARE → $MOUNT_POINT"

if mount -t cifs "//$SMB_SERVER/$SMB_SHARE" "$MOUNT_POINT" -o "$MOUNT_OPTS"; then
    log "Успешно смонтирован: //$SMB_SERVER/$SMB_SHARE → $MOUNT_POINT"
    exit 0
else
    log "ОШИБКА: Не удалось смонтировать //$SMB_SERVER/$SMB_SHARE"
    exit 1
fi
