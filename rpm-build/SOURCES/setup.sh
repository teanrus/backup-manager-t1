#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Ошибка: запустите скрипт от имени root (sudo $0)." >&2
    exit 1
fi

mkdir -p /var/lib/backup-manager
chmod 700 /var/lib/backup-manager
install -d -o root -g nginx -m 750 /etc/backup-manager
umask 077
API_TOKEN="$(openssl rand -hex 32)"
printf '%s\n' "$API_TOKEN" > /etc/backup-manager/api-token
API_TOKEN_HASH="$(printf '%s\n' "$API_TOKEN" | openssl passwd -6 -stdin)"
printf 'backup:%s\n' "$API_TOKEN_HASH" > /etc/backup-manager/htpasswd
chown root:nginx /etc/backup-manager/htpasswd
chmod 600 /etc/backup-manager/api-token
chmod 640 /etc/backup-manager/htpasswd
systemctl disable --now redos-backup-manager.timer >/dev/null 2>&1 || true
rm -f /etc/cron.d/redos-backup-manager
systemctl enable nginx.service
systemctl enable backup-manager-api.service
systemctl restart backup-manager-api.service
systemctl restart nginx.service
echo "Готово. Откройте http://localhost:8080 и войдите:"
echo "  Имя пользователя: backup"
echo "  Пароль: $API_TOKEN"
