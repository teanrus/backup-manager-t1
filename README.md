<div align="center">

# 🛡️ Система резервного копирования каталогов пользователя на удалённый SMB сервер

**rsync • SMB/CIFS • systemd • cron • веб-интерфейс**

[![Версия](https://img.shields.io/badge/версия-1.0.0-blue.svg)](https://redos.local)
[![Платформа](https://img.shields.io/badge/РЕД_ОС-7.3+-green.svg)](https://redos.red-soft.ru)
[![Лицензия](https://img.shields.io/badge/лицензия-MIT-orange.svg)](LICENSE)
[![RPM](https://img.shields.io/badge/пакет-RPM-red.svg)](rpm-build/)

</div>

---

## 📖 О проекте

Набор Bash-скриптов для резервного копирования пользовательских каталогов на SMB/CIFS через `rsync` в **РЕД ОС**. Веб-интерфейс в текущей версии является демонстрационным макетом: он не подключён к системному backend и не может проверять SMB, сохранять системные настройки или запускать копирование.

Решение обеспечивает:
- 🔄 **Инкрементальную синхронизацию** — копируются только изменённые файлы
- ⏰ **Автоматическое выполнение** по расписанию (systemd timer / cron)
- 🖱️ **Ручной запуск** из командной строки
- 🔒 **Безопасное хранение** учётных данных SMB
- 📊 **Журнал операций** в `/var/log/redos-backup/backup.log`
- 🔔 **Уведомления** по email о результатах

---

## ✨ Возможности

| Функция | Описание |
|---------|----------|
| 📁 Каталоги | Настройка исходных каталогов в `backup.conf` |
| 🌐 SMB подключение | Авто-монтирование скриптом и учётный файл с правами `600` |
| ⏰ Расписание | Ежедневный запуск через systemd timer и cron |
| 🚀 Ручной запуск | Запуск из командной строки |
| 📊 Веб-интерфейс | Демонстрационный макет; не отражает реальное состояние системы |
| ⚙️ Гибкие настройки | Сжатие, полоса, исключения, уведомления |
| 🔁 Повторные попытки | Автоматический retry при сбоях |
| 🔔 Уведомления | Email при ошибках и/или успехе |
| 🎨 Современный UI | Адаптивный интерфейс на React + Tailwind |

---

## 🖥️ Скриншоты

![scrin1](assets/34.png)

![scrin2](assets/46.png)

![scrin3](assets/47.png)

![scrin4](assets/49.png)

![scrin5](assets/52.png)

![scrin6](assets/61.png)
---

## 📋 Требования

### Для использования
- РЕД ОС 7.3 или новее
- Сетевое подключение к SMB серверу
- Свободное место на сервере

### Для сборки
- Node.js 18+
- npm 9+
- rpm-build
- Интернет для установки npm-пакетов

---

## 🚀 Быстрый старт

### 1. Сборка RPM пакета

```bash
# Установка зависимостей для сборки
sudo dnf install nodejs npm rpm-build

# Клонирование/копирование проекта
cd ~/projects
git clone <repository-url> redos-backup-manager
cd redos-backup-manager

# Сборка RPM
chmod +x rpm-build/build-rpm.sh
./rpm-build/build-rpm.sh
```

### 2. Установка

```bash
# Вариант 1: через dnf (рекомендуется)
sudo dnf install ~/rpmbuild/RPMS/noarch/redos-backup-manager-1.0.0-1.noarch.rpm

# Вариант 2: через rpm
sudo rpm -i ~/rpmbuild/RPMS/noarch/redos-backup-manager-1.0.0-1.noarch.rpm
```

### 3. Первоначальная настройка

```bash
sudo /usr/share/redos-backup-manager/scripts/setup.sh
```

Скрипт запросит:
- Адрес SMB сервера и имя общего ресурса
- Учётные данные для подключения
- Параметры rsync (сжатие, удаления, ограничения)
- Email для уведомлений

### 4. Использование

- **Веб-интерфейс:** http://localhost:8080
- **Ярлык в меню:** Приложения → Системные → Резервное копирование
- **Важно:** веб-интерфейс пока не связан с системными скриптами. Настройки в нём не применяются к системе, а запуск и проверка подключения не выполняются.
- Реальная конфигурация хранится в `/etc/redos-backup-manager/backup.conf`.
- Ручной запуск всех настроенных каталогов: `sudo /usr/share/redos-backup-manager/scripts/backup-all.sh`.
- Журнал: `/var/log/redos-backup/backup.log`.

---

## 📦 Что устанавливается

### Автоматические зависимости

| Пакет | Назначение |
|-------|-----------|
| `nginx` | Веб-сервер для интерфейса (порт 8080) |
| `rsync` | Утилита синхронизации файлов |
| `cifs-utils` | Утилиты для SMB/CIFS монтирования |
| `samba-client` | Клиент SMB |
| `cronie` | Планировщик задач |
| `systemd` | Система инициализации и таймеры |
| `nmap` | Диагностика сети |

---

## ⚙️ Конфигурация

Основной файл: `/etc/redos-backup-manager/backup.conf`

```bash
# ==========================================
# SMB подключение
# ==========================================
SMB_SERVER="192.168.1.100"
SMB_SHARE="backups"
SMB_USERNAME="backup_user"
SMB_PASSWORD="password"
SMB_DOMAIN="WORKGROUP"
MOUNT_POINT="/mnt/backup"

# ==========================================
# Параметры rsync
# ==========================================
COMPRESSION="true"              # Сжатие при передаче (-z)
DELETE_EXTRA="true"             # Удалять лишние (--delete)
BANDWIDTH_LIMIT=0               # 0 = без ограничений (Мбит/с)
MAX_RETRIES=3                   # Повторные попытки
RETRY_DELAY=60                  # Задержка между попытками (сек)
VERBOSE="false"                 # Подробный вывод

# Исключения (шаблоны через пробел)
EXCLUDE_PATTERNS="*.tmp *.cache .thumbnails *.swp"

# ==========================================
# Уведомления
# ==========================================
NOTIFY_EMAIL="admin@example.com"

# ==========================================
# Каталоги для копирования
# ==========================================
USER_HOME="/home/user"
BACKUP_DIRS="Документы Изображения Рабочий\ стол Загрузки .config"
```

---

## 🛠️ Управление

### Сервисы systemd

```bash
# Статус таймера
systemctl status redos-backup-manager.timer

# Ручной запуск копирования
sudo systemctl start redos-backup-manager.service

# Просмотр логов в реальном времени
journalctl -u redos-backup-manager.service -f

# Изменение расписания
sudo systemctl edit redos-backup-manager.timer
```

### Пример изменения расписания

```ini
# Каждые 6 часов
[Timer]
OnCalendar=*-*-* 00/6:00:00

# Каждые 30 минут
[Timer]
OnCalendar=*:0/30

# Только по будням в 02:00
[Timer]
OnCalendar=Mon..Fri *-*-* 02:00:00
```

### Ручное копирование

```bash
# Один каталог
sudo /usr/share/redos-backup-manager/scripts/backup.sh \
    /home/user/Документы "Документы"

# Все настроенные каталоги
sudo /usr/share/redos-backup-manager/scripts/backup-all.sh

# Проверка SMB подключения
sudo /usr/share/redos-backup-manager/scripts/mount-smb.sh
```

---

## 🗑️ Удаление

```bash
# Удаление пакета (конфигурация сохраняется)
sudo dnf remove redos-backup-manager

# Полное удаление (включая конфигурацию и логи)
sudo /usr/share/redos-backup-manager/scripts/uninstall.sh
```

---

## 🔧 Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера (порт 5173)
npm run dev

# Сборка для production
npm run build

# Сборка RPM (альтернатива build-rpm.sh)
make rpm

# Локальная установка без RPM
sudo make install

# Первоначальная настройка
sudo make setup
```

### Структура исходного кода

```
src/
├── App.tsx              # Главный компонент, роутинг
├── Sidebar.tsx          # Боковая панель навигации
├── Dashboard.tsx        # Дашборд со статистикой
├── JobsPage.tsx         # Управление заданиями
├── SMBPage.tsx          # Настройки SMB сервера
├── SchedulePage.tsx     # Визуальное расписание
├── LogsPage.tsx         # Журнал с фильтрами
├── SettingsPage.tsx     # Общие настройки
├── AboutPage.tsx        # О программе
├── types.ts             # TypeScript типы
└── data.ts              # Начальные данные (демо)
```

---

## 🔍 Устранение неполадок

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

# Просмотр логов
tail -100 /var/log/redos-backup/backup.log
```

### Веб-интерфейс недоступен

```bash
# Проверка nginx
sudo systemctl status nginx
sudo nginx -t

# Проверка порта
ss -tlnp | grep 8080

# Перезапуск
sudo systemctl restart nginx
```

### Таймер не срабатывает

```bash
# Проверка статуса
systemctl list-timers | grep backup

# Просмотр расписания
systemctl cat redos-backup-manager.timer

# Ручной запуск
sudo systemctl start redos-backup-manager.service
```

---

## 📊 Мониторинг

### Логи

```bash
# Основной журнал
tail -f /var/log/redos-backup/backup.log

# Журнал rsync
tail -f /var/log/redos-backup/rsync.log

# Журнал systemd
journalctl -u redos-backup-manager.service --since today
```

### Статистика

```bash
# Размер резервных копий
du -sh /mnt/backup/*

# Количество файлов
find /mnt/backup -type f | wc -l

# Последние изменения
find /mnt/backup -type f -mtime -1 | head -20
```

---

<div align="center">

**Сделано с ❤️ для РЕД ОС**

</div>
