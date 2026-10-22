# РЕД ОС — Система резервного копирования

Веб-интерфейс для управления резервным копированием пользовательских каталогов на удалённый SMB/CIFS сервер с помощью rsync.

## 🚀 Быстрый старт

### Сборка RPM пакета

```bash
# 1. Установите зависимости для сборки
sudo dnf install nodejs npm rpm-build

# 2. Клонируйте/скопируйте проект
cd redos-backup-manager

# 3. Запустите сборку
chmod +x rpm-build/build-rpm.sh
./rpm-build/build-rpm.sh
```

### Установка

```bash
# Установка RPM пакета
sudo dnf install ~/rpmbuild/RPMS/noarch/redos-backup-manager-1.0.0-1.noarch.rpm

# Первоначальная настройка
sudo /usr/share/redos-backup-manager/scripts/setup.sh
```

### Использование

- **Веб-интерфейс:** http://localhost:8080
- **Ярлык в меню:** Приложения → Системные → Резервное копирование

## 📦 Что входит в RPM пакет

### Зависимости (устанавливаются автоматически)

| Пакет | Назначение |
|-------|-----------|
| `nginx` | Веб-сервер для интерфейса (порт 8080) |
| `rsync` | Утилита синхронизации файлов |
| `cifs-utils` | Утилиты для SMB/CIFS монтирования |
| `samba-client` | Клиент SMB |
| `cronie` | Планировщик задач |
| `systemd` | Система инициализации и таймеры |
| `nmap` | Диагностика сети |

### Устанавливаемые файлы

```
/usr/share/redos-backup-manager/
├── web/                         # Веб-интерфейс (React)
├── scripts/
│   ├── backup.sh               # Копирование одного каталога
│   ├── backup-all.sh           # Копирование всех каталогов
│   ├── mount-smb.sh            # Монтирование SMB ресурса
│   ├── setup.sh                # Первоначальная настройка
│   └── uninstall.sh            # Полное удаление
└── icons/
    └── redos-backup-manager.png # Иконка приложения

/etc/redos-backup-manager/
├── backup.conf                 # Основной файл конфигурации
└── smb-credentials             # Учётные данные SMB (chmod 600)

/etc/nginx/conf.d/
└── redos-backup-manager.conf   # Конфигурация Nginx

/etc/cron.d/
└── redos-backup-manager        # Cron задание

/usr/lib/systemd/system/
├── redos-backup-manager.service  # Systemd сервис
└── redos-backup-manager.timer    # Systemd таймер (ежедневно в 03:00)

/usr/share/applications/
└── redos-backup-manager.desktop  # Ярлык в меню приложений

/var/log/redos-backup/
├── backup.log                  # Журнал операций
└── rsync.log                   # Журнал rsync
```

## ⚙️ Конфигурация

После установки настройка выполняется интерактивно:

```bash
sudo /usr/share/redos-backup-manager/scripts/setup.sh
```

Или вручную в файле `/etc/redos-backup-manager/backup.conf`:

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

# Каталоги для копирования
USER_HOME="/home/user"
BACKUP_DIRS="Документы Изображения Рабочий\ стол Загрузки .config"
```

## 🛠️ Управление

### Сервисы

```bash
# Статус таймера
systemctl status redos-backup-manager.timer

# Ручной запуск копирования
sudo systemctl start redos-backup-manager.service

# Просмотр логов
journalctl -u redos-backup-manager.service -f
```

### Ручное копирование

```bash
# Один каталог
sudo /usr/share/redos-backup-manager/scripts/backup.sh /home/user/Документы "Документы"

# Все каталоги
sudo /usr/share/redos-backup-manager/scripts/backup-all.sh
```

### Изменение расписания

```bash
sudo systemctl edit redos-backup-manager.timer
```

Пример — каждые 6 часов:
```ini
[Timer]
OnCalendar=*-*-* 00/6:00:00
```

## 🗑️ Удаление

```bash
# Удаление пакета
sudo dnf remove redos-backup-manager

# Полное удаление (включая конфигурацию и логи)
sudo /usr/share/redos-backup-manager/scripts/uninstall.sh
```

## 📋 Структура проекта

```
redos-backup-manager/
├── src/                        # Исходный код веб-интерфейса
│   ├── App.tsx                 # Главный компонент
│   ├── Sidebar.tsx             # Боковая панель
│   ├── Dashboard.tsx           # Дашборд
│   ├── JobsPage.tsx            # Управление заданиями
│   ├── SMBPage.tsx             # Настройки SMB
│   ├── SchedulePage.tsx        # Расписание
│   ├── LogsPage.tsx            # Журнал
│   ├── SettingsPage.tsx        # Настройки
│   ├── AboutPage.tsx           # О программе
│   ├── types.ts                # TypeScript типы
│   └── data.ts                 # Начальные данные
├── rpm-build/                  # Файлы для сборки RPM
│   ├── SPECS/
│   │   └── redos-backup-manager.spec  # Spec файл
│   ├── SOURCES/
│   │   ├── backup.sh           # Скрипт копирования
│   │   ├── backup-all.sh       # Скрипт копирования всех
│   │   ├── mount-smb.sh        # Скрипт монтирования
│   │   ├── setup.sh            # Скрипт настройки
│   │   ├── uninstall.sh        # Скрипт удаления
│   │   ├── backup.conf         # Конфигурация
│   │   ├── redos-backup-manager.conf  # Nginx конфиг
│   │   ├── redos-backup-manager.cron  # Cron задание
│   │   ├── redos-backup-manager.service # Systemd service
│   │   ├── redos-backup-manager.timer   # Systemd timer
│   │   └── redos-backup-manager.desktop # Desktop файл
│   ├── build-rpm.sh            # Скрипт сборки RPM
│   └── README.md               # Документация RPM
├── Makefile                    # Makefile для сборки
├── package.json                # npm зависимости
├── vite.config.js              # Конфигурация Vite
└── README.md                   # Этот файл
```

## 🔧 Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для production
npm run build

# Сборка RPM
make rpm
```

## 📝 Лицензия

MIT
