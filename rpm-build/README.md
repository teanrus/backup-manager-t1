# РЕД ОС — Система резервного копирования

Веб-интерфейс для управления резервным копированием пользовательских каталогов на удалённый SMB/CIFS сервер с помощью rsync.

## Возможности

- 📁 Резервное копирование каталогов пользователя (Документы, Изображения, Рабочий стол и др.)
- 🌐 Подключение к удалённому SMB/CIFS серверу
- ⏰ Автоматическое выполнение по расписанию (cron / systemd timer)
- 🖱️ Ручной запуск копирования из веб-интерфейса
- 📊 Мониторинг состояния и журнал операций
- 🔔 Уведомления по email
- 🔄 Синхронизация через rsync (инкрементальная, с проверкой целостности)
- 🔒 Безопасное хранение учётных данных

## Системные требования

- РЕД ОС 7.3 или новее
- Сетевое подключение к SMB серверу
- Свободное место на сервере для резервных копий

## Установка из RPM

### 1. Сборка пакета

```bash
# Установите зависимости для сборки
sudo dnf install nodejs npm rpm-build

# Перейдите в директорию проекта
cd redos-backup-manager

# Запустите скрипт сборки
chmod +x rpm-build/build-rpm.sh
./rpm-build/build-rpm.sh
```

### 2. Установка RPM

```bash
sudo dnf install ~/rpmbuild/RPMS/noarch/redos-backup-manager-1.0.0-1.noarch.rpm
```

### 3. Первоначальная настройка

```bash
sudo /usr/share/redos-backup-manager/scripts/setup.sh
```

Скрипт запросит:
- Адрес SMB сервера и имя ресурса
- Учётные данные для подключения
- Параметры rsync (сжатие, удаление лишних файлов, ограничение полосы)
- Email для уведомлений

## Использование

### Веб-интерфейс

После установки откройте в браузере:

```
http://localhost:8080
```

Или используйте ярлык **«Резервное копирование»** в меню приложений.

### Ручной запуск

```bash
# Копирование одного каталога
sudo /usr/share/redos-backup-manager/scripts/backup.sh /home/user/Документы "Документы"

# Копирование всех настроенных каталогов
sudo /usr/share/redos-backup-manager/scripts/backup-all.sh
```

### Управление сервисами

```bash
# Статус таймера резервного копирования
systemctl status redos-backup-manager.timer

# Запуск резервного копирования вручную через systemd
sudo systemctl start redos-backup-manager.service

# Просмотр логов
journalctl -u redos-backup-manager.service -f

# Логи rsync
tail -f /var/log/redos-backup/backup.log
```

## Структура файлов

```
/usr/share/redos-backup-manager/
├── web/                    # Веб-интерфейс
├── scripts/
│   ├── backup.sh          # Скрипт резервного копирования одного каталога
│   ├── backup-all.sh      # Скрипт копирования всех каталогов
│   ├── mount-smb.sh       # Скрипт монтирования SMB ресурса
│   └── setup.sh           # Скрипт первоначальной настройки
└── icons/
    └── redos-backup-manager.png

/etc/redos-backup-manager/
├── backup.conf            # Основной файл конфигурации
└── smb-credentials        # Учётные данные SMB (права 600)

/etc/nginx/conf.d/
└── redos-backup-manager.conf  # Конфигурация Nginx

/etc/cron.d/
└── redos-backup-manager       # Cron задание

/usr/lib/systemd/system/
├── redos-backup-manager.service  # Systemd сервис
└── redos-backup-manager.timer    # Systemd таймер

/var/log/redos-backup/
├── backup.log             # Журнал операций
├── rsync.log              # Журнал rsync
└── nginx-*.log            # Журналы Nginx
```

## Конфигурация

Основной файл конфигурации: `/etc/redos-backup-manager/backup.conf`

```bash
# SMB подключение
SMB_SERVER="192.168.1.100"
SMB_SHARE="backups"
SMB_USERNAME="backup_user"
SMB_PASSWORD="password"
SMB_DOMAIN="WORKGROUP"
MOUNT_POINT="/mnt/backup"

# Параметры rsync
COMPRESSION="true"
DELETE_EXTRA="true"
BANDWIDTH_LIMIT=0
MAX_RETRIES=3
RETRY_DELAY=60

# Исключения
EXCLUDE_PATTERNS="*.tmp *.cache .thumbnails"

# Уведомления
NOTIFY_EMAIL="admin@example.com"

# Каталоги для копирования
USER_HOME="/home/user"
BACKUP_DIRS="Документы Изображения Рабочий\ стол Загрузки .config"
```

## Расписание

По умолчанию резервное копирование выполняется:
- **Ежедневно в 03:00** (через systemd timer)
- Также настроено cron задание как резервный вариант

Изменить расписание:

```bash
sudo systemctl edit redos-backup-manager.timer
```

Пример (каждые 6 часов):
```ini
[Timer]
OnCalendar=*-*-* 00/6:00:00
```

## Удаление

```bash
sudo dnf remove redos-backup-manager
```

## Устранение неполадок

### SMB не монтируется

```bash
# Проверка доступности сервера
ping 192.168.1.100

# Проверка SMB портов
nmap -p 445 192.168.1.100

# Ручное монтирование для диагностики
sudo /usr/share/redos-backup-manager/scripts/mount-smb.sh

# Проверка учётных данных
sudo cat /etc/redos-backup-manager/smb-credentials
```

### rsync завершается с ошибкой

```bash
# Проверка прав на SMB ресурс
ls -la /mnt/backup/

# Запуск rsync вручную
rsync -avz /home/user/Документы/ /mnt/backup/Документы/

# Проверка логов
tail -100 /var/log/redos-backup/backup.log
```

### Веб-интерфейс недоступен

```bash
# Проверка nginx
sudo systemctl status nginx
sudo nginx -t

# Проверка порта
ss -tlnp | grep 8080
```

## Лицензия

MIT
