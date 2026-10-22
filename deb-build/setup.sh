#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Ошибка: запустите скрипт от имени root (sudo $0)." >&2
    exit 1
fi

if ! getent group www-data >/dev/null; then
    echo "Ошибка: не найдена группа www-data, необходимая для доступа Nginx к файлу авторизации." >&2
    exit 1
fi

install -d -o root -g www-data -m 750 /etc/backup-manager
install -d -o root -g root -m 755 /var/log/backup-manager
install -d -o root -g root -m 700 /var/lib/backup-manager

umask 077
api_token="$(openssl rand -hex 32)"
printf '%s\n' "$api_token" > /etc/backup-manager/api-token
api_token_hash="$(printf '%s\n' "$api_token" | openssl passwd -6 -stdin)"
printf 'backup:%s\n' "$api_token_hash" > /etc/backup-manager/htpasswd
chown root:www-data /etc/backup-manager/htpasswd
chmod 600 /etc/backup-manager/api-token
chmod 640 /etc/backup-manager/htpasswd

nginx -t
systemctl enable nginx.service
systemctl enable backup-manager-api.service
systemctl restart backup-manager-api.service
systemctl restart nginx.service

echo "Готово. Откройте http://localhost:8080 и войдите:"
echo "  Имя пользователя: backup"
echo "  Пароль: $api_token"
