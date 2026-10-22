#!/bin/bash
#
# РЕД ОС - Система резервного копирования
# Скрипт первоначальной настройки
#

set -euo pipefail

CONFIG_FILE="/etc/redos-backup-manager/backup.conf"

echo "=========================================="
echo " РЕД ОС - Резервное копирование"
echo " Первоначальная настройка"
echo "=========================================="
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo "ОШИБКА: Скрипт должен быть запущен от имени root"
    echo "Используйте: sudo $0"
    exit 1
fi

# Установка зависимостей
echo "Установка необходимых пакетов..."
dnf install -y nginx rsync cifs-utils samba-client cronie 2>/dev/null || {
    echo "ОШИБКА: Не удалось установить пакеты. Проверьте подключение к интернету."
    exit 1
}
echo "✓ Пакеты установлены"
echo ""

# Настройка SMB подключения
echo "--- Настройка SMB подключения ---"
read -p "IP-адрес SMB сервера: " SMB_SERVER
read -p "Имя общего ресурса (share): " SMB_SHARE
read -p "Имя пользователя: " SMB_USERNAME
read -s -p "Пароль: " SMB_PASSWORD
echo ""
read -p "Домен/рабочая группа [WORKGROUP]: " SMB_DOMAIN
SMB_DOMAIN=${SMB_DOMAIN:-WORKGROUP}
read -p "Точка монтирования [/mnt/backup]: " MOUNT_POINT
MOUNT_POINT=${MOUNT_POINT:-/mnt/backup}

echo ""

# Настройка параметров rsync
echo "--- Параметры rsync ---"
read -p "Использовать сжатие? [Y/n]: " USE_COMPRESSION
USE_COMPRESSION=${USE_COMPRESSION:-Y}
read -p "Удалять лишние файлы в приёмнике? [Y/n]: " DELETE_EXTRA
DELETE_EXTRA=${DELETE_EXTRA:-Y}
read -p "Ограничение полосы пропускания (Мбит/с, 0=без ограничений) [0]: " BANDWIDTH_LIMIT
BANDWIDTH_LIMIT=${BANDWIDTH_LIMIT:-0}
read -p "Количество повторных попыток [3]: " MAX_RETRIES
MAX_RETRIES=${MAX_RETRIES:-3}

echo ""

# Настройка уведомлений
echo "--- Уведомления ---"
read -p "Email для уведомлений (оставьте пустым для отключения): " NOTIFY_EMAIL

echo ""

# Запись конфигурации
echo "Запись конфигурации..."
cat > "$CONFIG_FILE" << EOF
# РЕД ОС - Резервное копирование
# Конфигурация сгенерирована: $(date '+%Y-%m-%d %H:%M:%S')

# SMB подключение
SMB_SERVER="$SMB_SERVER"
SMB_SHARE="$SMB_SHARE"
SMB_USERNAME="$SMB_USERNAME"
SMB_PASSWORD="$SMB_PASSWORD"
SMB_DOMAIN="$SMB_DOMAIN"
MOUNT_POINT="$MOUNT_POINT"

# Параметры rsync
COMPRESSION="$([ "$USE_COMPRESSION" = "Y" ] || [ "$USE_COMPRESSION" = "y" ] && echo "true" || echo "false")"
DELETE_EXTRA="$([ "$DELETE_EXTRA" = "Y" ] || [ "$DELETE_EXTRA" = "y" ] && echo "true" || echo "false")"
BANDWIDTH_LIMIT=$BANDWIDTH_LIMIT
MAX_RETRIES=$MAX_RETRIES
RETRY_DELAY=60
VERBOSE="false"

# Исключения (шаблоны файлов/каталогов)
EXCLUDE_PATTERNS="*.tmp *.cache .thumbnails"

# Уведомления
NOTIFY_EMAIL="$NOTIFY_EMAIL"

# Каталог пользователя для резервного копирования
USER_HOME="/home/$(logname 2>/dev/null || echo "user")"
BACKUP_DIRS="Документы Изображения Рабочий\ стол Загрузки .config"
EOF

chmod 600 "$CONFIG_FILE"
echo "✓ Конфигурация сохранена: $CONFIG_FILE"
echo ""

# Создание точки монтирования
mkdir -p "$MOUNT_POINT"
echo "✓ Точка монтирования создана: $MOUNT_POINT"

# Создание директории логов
mkdir -p /var/log/redos-backup
touch /var/log/redos-backup/backup.log
chmod 755 /var/log/redos-backup
echo "✓ Директория логов создана"

# Добавление fstab записи
FSTAB_ENTRY="//$SMB_SERVER/$SMB_SHARE $MOUNT_POINT cifs credentials=/etc/redos-backup-manager/smb-credentials,iocharset=utf8,file_mode=0700,dir_mode=0700,_netdev,nofail 0 0"
if ! grep -q "$SMB_SERVER/$SMB_SHARE" /etc/fstab 2>/dev/null; then
    echo "$FSTAB_ENTRY" >> /etc/fstab
    echo "✓ Запись добавлена в /etc/fstab"
fi

# Настройка nginx
echo ""
echo "Настройка веб-сервера..."
systemctl enable nginx.service
systemctl restart nginx.service
echo "✓ Nginx запущен"

# Настройка cron
echo ""
echo "Настройка расписания..."
systemctl enable crond.service
systemctl restart crond.service
echo "✓ Cron настроен"

# Включение таймера systemd
systemctl enable redos-backup-manager.timer
systemctl start redos-backup-manager.timer
echo "✓ Таймер резервного копирования активирован"

echo ""
echo "=========================================="
echo " Настройка завершена!"
echo "=========================================="
echo ""
echo " Веб-интерфейс: http://localhost:8080"
echo " Конфигурация:  $CONFIG_FILE"
echo " Журнал:        /var/log/redos-backup/backup.log"
echo ""
echo " Для проверки подключения к SMB:"
echo "   sudo /usr/share/redos-backup-manager/scripts/mount-smb.sh"
echo ""
echo " Для ручного запуска резервного копирования:"
echo "   sudo /usr/share/redos-backup-manager/scripts/backup.sh /home/user/Документы \"Документы\""
echo ""
echo "=========================================="
