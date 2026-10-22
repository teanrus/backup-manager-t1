Name:           redos-backup-manager
Version:        1.0.0
Release:        1%{?dist}
Summary:        Backup Manager for SMB/CIFS
License:        MIT
URL:            https://github.com/teanrus/backup-manager-t1
BuildArch:      noarch

Requires:       nginx
Requires:       nodejs >= 18
Requires:       rsync
Requires:       cifs-utils
Requires:       samba-client
Requires:       openssl
Requires:       systemd

BuildRequires:  systemd

%description
Приложение для локального управления резервным копированием каталогов
на SMB/CIFS сервер с помощью rsync.

Возможности:
- Настройка подключения к SMB серверу
- Управление заданиями резервного копирования
- Настройка расписания в backend
- Ручной запуск копирования
- Мониторинг и журнал операций
- Автоматическое монтирование SMB ресурса
- Инкрементальная синхронизация через rsync

%prep
# Исходный код уже собран в dist/ и помещён в SOURCES/dist/

%build
# Сборка выполнена на этапе подготовки

%install
# ==========================================
# Создание директорий
# ==========================================
mkdir -p %{buildroot}/usr/share/redos-backup-manager/web
mkdir -p %{buildroot}/usr/share/redos-backup-manager/scripts
mkdir -p %{buildroot}/usr/share/redos-backup-manager/server
mkdir -p %{buildroot}/usr/share/redos-backup-manager/icons
mkdir -p %{buildroot}/etc/redos-backup-manager
mkdir -p %{buildroot}/etc/nginx/conf.d
mkdir -p %{buildroot}/usr/lib/systemd/system
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/var/log/redos-backup
mkdir -p %{buildroot}/var/run/redos-backup
mkdir -p %{buildroot}/var/lib/backup-manager

# ==========================================
# Копирование веб-приложения
# ==========================================
cp -r %{_sourcedir}/dist/* %{buildroot}/usr/share/redos-backup-manager/web/
cp -r %{_sourcedir}/server/* %{buildroot}/usr/share/redos-backup-manager/server/

# ==========================================
# Установка скриптов
# ==========================================
install -m 755 %{_sourcedir}/backup.sh %{buildroot}/usr/share/redos-backup-manager/scripts/backup.sh
install -m 755 %{_sourcedir}/backup-all.sh %{buildroot}/usr/share/redos-backup-manager/scripts/backup-all.sh
install -m 755 %{_sourcedir}/mount-smb.sh %{buildroot}/usr/share/redos-backup-manager/scripts/mount-smb.sh
install -m 755 %{_sourcedir}/setup.sh %{buildroot}/usr/share/redos-backup-manager/scripts/setup.sh
install -m 755 %{_sourcedir}/uninstall.sh %{buildroot}/usr/share/redos-backup-manager/scripts/uninstall.sh

# ==========================================
# Установка конфигурации
# ==========================================
install -m 644 %{_sourcedir}/redos-backup-manager.conf %{buildroot}/etc/nginx/conf.d/redos-backup-manager.conf
install -m 600 %{_sourcedir}/backup.conf %{buildroot}/etc/redos-backup-manager/backup.conf

# ==========================================
# ==========================================
# Установка systemd юнитов
# ==========================================
install -m 644 %{_sourcedir}/redos-backup-manager.service %{buildroot}/usr/lib/systemd/system/redos-backup-manager.service
install -m 644 %{_sourcedir}/redos-backup-manager.timer %{buildroot}/usr/lib/systemd/system/redos-backup-manager.timer
install -m 644 %{_sourcedir}/backup-manager-api.service %{buildroot}/usr/lib/systemd/system/backup-manager-api.service

# ==========================================
# Установка иконки и desktop файла
# ==========================================
install -m 644 %{_sourcedir}/redos-backup-manager.png %{buildroot}/usr/share/redos-backup-manager/icons/redos-backup-manager.png
install -m 644 %{_sourcedir}/redos-backup-manager.desktop %{buildroot}/usr/share/applications/redos-backup-manager.desktop

# ==========================================
# Создание файла журнала
# ==========================================
touch %{buildroot}/var/log/redos-backup/backup.log

%post
# Обновление базы systemd
systemctl daemon-reload

# Создание каталогов состояния и точки монтирования
mkdir -p /var/lib/backup-manager
chmod 700 /var/lib/backup-manager
mkdir -p /mnt/backup

# Включение и запуск nginx
systemctl enable nginx.service >/dev/null 2>&1 || true
systemctl restart nginx.service >/dev/null 2>&1 || true

# Отключение прежнего расписания, чтобы задания не запускались дважды
systemctl disable --now redos-backup-manager.timer >/dev/null 2>&1 || true
rm -f /etc/cron.d/redos-backup-manager

# Запуск backend
systemctl enable backup-manager-api.service >/dev/null 2>&1 || true
systemctl restart backup-manager-api.service >/dev/null 2>&1 || true

# Обновление базы desktop файлов
update-desktop-database >/dev/null 2>&1 || true

# Установка прав
chmod 755 /var/log/redos-backup
chmod 755 /var/run/redos-backup
chmod 700 /var/lib/backup-manager

echo ""
echo "=========================================="
echo " ✓ Резервное копирование"
echo "   Пакет успешно установлен!"
echo "=========================================="
echo ""
echo " Для настройки выполните:"
echo "   sudo /usr/share/redos-backup-manager/scripts/setup.sh"
echo ""
echo " Веб-интерфейс: http://localhost:8080"
echo " Ярлык в меню:  Системные → Резервное копирование"
echo "=========================================="
echo ""

%preun
# Остановка сервисов при полном удалении пакета
if [ $1 -eq 0 ]; then
    systemctl stop redos-backup-manager.timer >/dev/null 2>&1 || true
    systemctl disable redos-backup-manager.timer >/dev/null 2>&1 || true
    systemctl stop redos-backup-manager.service >/dev/null 2>&1 || true
    systemctl disable redos-backup-manager.service >/dev/null 2>&1 || true
    systemctl stop backup-manager-api.service >/dev/null 2>&1 || true
    systemctl disable backup-manager-api.service >/dev/null 2>&1 || true
fi

%postun
# Обновление systemd и desktop database
systemctl daemon-reload >/dev/null 2>&1 || true
update-desktop-database >/dev/null 2>&1 || true

# Уведомление при полном удалении
if [ $1 -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo " Резервное копирование удалено"
    echo "=========================================="
    echo ""
    echo " Конфигурация сохранена в:"
    echo "   /etc/redos-backup-manager/"
    echo " Журналы сохранены в:"
    echo "   /var/log/redos-backup/"
    echo ""
    echo " Для полного удаления:"
    echo "   sudo rm -rf /etc/redos-backup-manager"
    echo "   sudo rm -rf /var/log/redos-backup"
    echo "   sudo rm -rf /usr/share/redos-backup-manager"
    echo "=========================================="
    echo ""
fi

%files
%defattr(-,root,root,-)

# Веб-приложение
%dir /usr/share/redos-backup-manager
/usr/share/redos-backup-manager/web/*
/usr/share/redos-backup-manager/server/*

# Скрипты
/usr/share/redos-backup-manager/scripts/backup.sh
/usr/share/redos-backup-manager/scripts/backup-all.sh
/usr/share/redos-backup-manager/scripts/mount-smb.sh
/usr/share/redos-backup-manager/scripts/setup.sh
/usr/share/redos-backup-manager/scripts/uninstall.sh

# Иконка
/usr/share/redos-backup-manager/icons/redos-backup-manager.png

# Конфигурация
%config(noreplace) /etc/redos-backup-manager/backup.conf
%config(noreplace) /etc/nginx/conf.d/redos-backup-manager.conf

# Systemd юниты
/usr/lib/systemd/system/redos-backup-manager.service
/usr/lib/systemd/system/redos-backup-manager.timer
/usr/lib/systemd/system/backup-manager-api.service

# Desktop файл (ярлык в меню приложений)
/usr/share/applications/redos-backup-manager.desktop

# Директории для данных
%dir /var/log/redos-backup
/var/log/redos-backup/backup.log
%ghost /var/run/redos-backup

%changelog
* Wed Jan 15 2026 Backup Manager Team <backup@example.invalid> - 1.0.0-1
- Первый релиз системы резервного копирования
- Веб-интерфейс управления на React/TypeScript
- Интеграция с rsync для инкрементальной синхронизации
- Подключение к SMB/CIFS серверам через cifs-utils
- Автоматическое расписание в локальном backend
- Ручной запуск из веб-интерфейса
- Мониторинг состояния и журнал операций
- Ярлык в меню приложений
- Nginx для обслуживания веб-интерфейса
