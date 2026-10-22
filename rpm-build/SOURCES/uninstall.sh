#!/bin/bash
#
# РЕД ОС - Система резервного копирования
# Скрипт полного удаления (после rpm -e)
#

set -euo pipefail

echo "=========================================="
echo " РЕД ОС - Полное удаление"
echo " Системы резервного копирования"
echo "=========================================="
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo "ОШИБКА: Скрипт должен быть запущен от имени root"
    echo "Используйте: sudo $0"
    exit 1
fi

# Подтверждение
read -p "Вы уверены, что хотите полностью удалить систему? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Отменено."
    exit 0
fi

echo ""
echo "Удаление компонентов..."

# Остановка сервисов
echo "  Остановка сервисов..."
systemctl stop redos-backup-manager.timer 2>/dev/null || true
systemctl stop redos-backup-manager.service 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

# Удаление systemd юнитов
echo "  Удаление systemd юнитов..."
rm -f /usr/lib/systemd/system/redos-backup-manager.service
rm -f /usr/lib/systemd/system/redos-backup-manager.timer
systemctl daemon-reload

# Удаление конфигурации
echo "  Удаление конфигурации..."
rm -rf /etc/redos-backup-manager
rm -f /etc/nginx/conf.d/redos-backup-manager.conf
rm -f /etc/cron.d/redos-backup-manager

# Удаление файлов приложения
echo "  Удаление файлов приложения..."
rm -rf /usr/share/redos-backup-manager

# Удаление desktop файла
echo "  Удаление ярлыка из меню..."
rm -f /usr/share/applications/redos-backup-manager.desktop
update-desktop-database 2>/dev/null || true

# Удаление логов
echo "  Удаление журналов..."
rm -rf /var/log/redos-backup

# Удаление lock-директории
rm -rf /var/run/redos-backup

# Удаление точки монтирования (если пуста)
if mountpoint -q /mnt/backup 2>/dev/null; then
    umount /mnt/backup 2>/dev/null || true
fi
if [ -d /mnt/backup ] && [ -z "$(ls -A /mnt/backup 2>/dev/null)" ]; then
    rmdir /mnt/backup 2>/dev/null || true
fi

# Удаление fstab записи
if grep -q "redos-backup" /etc/fstab 2>/dev/null; then
    sed -i '/redos-backup/d' /etc/fstab
    echo "  Удалена запись из /etc/fstab"
fi

echo ""
echo "=========================================="
echo " ✓ Удаление завершено"
echo "=========================================="
echo ""
echo " Примечание: Резервные копии на удалённом"
echo " SMB сервере НЕ были удалены."
echo "=========================================="
