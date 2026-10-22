#!/bin/bash
#
# РЕД ОС - Система резервного копирования
# Скрипт сборки RPM пакета
#
# Использование:
#   ./build-rpm.sh
#
# Требования:
#   - Node.js 18+
#   - npm
#   - rpm-build
#
# Результат:
#   RPM пакет в ~/rpmbuild/RPMS/noarch/
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PKG_NAME="redos-backup-manager"
PKG_VERSION="1.0.0"
PKG_RELEASE="1"

echo "=========================================="
echo " Сборка RPM пакета: $PKG_NAME"
echo " Версия: $PKG_VERSION-$PKG_RELEASE"
echo "=========================================="
echo ""

# ==========================================
# [1/7] Проверка зависимостей для сборки
# ==========================================
echo "[1/7] Проверка зависимостей..."
for cmd in node npm rpmbuild; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ОШИБКА: Не найдена команда: $cmd"
        case "$cmd" in
            node|npm)
                echo "Установите: sudo dnf install nodejs npm"
                ;;
            rpmbuild)
                echo "Установите: sudo dnf install rpm-build"
                ;;
        esac
        exit 1
    fi
done
echo "✓ Все зависимости для сборки найдены"
echo ""

# ==========================================
# [2/7] Установка npm зависимостей
# ==========================================
echo "[2/7] Установка npm зависимостей..."
cd "$PROJECT_DIR"
npm install
echo "✓ npm зависимости установлены"
echo ""

# ==========================================
# [3/7] Сборка веб-приложения
# ==========================================
echo "[3/7] Сборка веб-приложения..."
npm run build
echo "✓ Веб-приложение собрано"
echo ""

# ==========================================
# [4/7] Подготовка структуры rpmbuild
# ==========================================
echo "[4/7] Подготовка структуры rpmbuild..."

# Создание директорий rpmbuild
mkdir -p ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

# Копирование spec файла
cp "$SCRIPT_DIR/SPECS/$PKG_NAME.spec" ~/rpmbuild/SPECS/

# Копирование исходных файлов (скрипты, конфиги)
cp "$SCRIPT_DIR/SOURCES/backup.sh" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/backup-all.sh" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/mount-smb.sh" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/setup.sh" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/uninstall.sh" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/backup.conf" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/redos-backup-manager.conf" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/redos-backup-manager.cron" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/redos-backup-manager.service" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/redos-backup-manager.timer" ~/rpmbuild/SOURCES/
cp "$SCRIPT_DIR/SOURCES/redos-backup-manager.desktop" ~/rpmbuild/SOURCES/

# Копирование собранного веб-приложения
rm -rf ~/rpmbuild/SOURCES/dist
mkdir -p ~/rpmbuild/SOURCES/dist
cp -r "$PROJECT_DIR/dist/"* ~/rpmbuild/SOURCES/dist/

# Копирование иконки
if [ -f "$PROJECT_DIR/public/icon.png" ]; then
    cp "$PROJECT_DIR/public/icon.png" ~/rpmbuild/SOURCES/$PKG_NAME.png
    echo "  ✓ Иконка найдена и скопирована"
else
    echo "  ⚠ Иконка не найдена в public/icon.png"
    echo "  Создаём иконку-заглушку..."
    # Создаём минимальный PNG (1x1 прозрачный пиксель)
    printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0a\x49\x44\x41\x54\x78\x9c\x63\x00\x01\x00\x00\x05\x00\x01\x0d\x0a\x2d\xb4\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > ~/rpmbuild/SOURCES/$PKG_NAME.png
fi

echo "✓ Структура rpmbuild подготовлена"
echo ""

# ==========================================
# [5/7] Проверка spec файла
# ==========================================
echo "[5/7] Проверка spec файла..."
cd ~/rpmbuild

# Проверка что все файлы на месте
MISSING=0
for f in backup.sh backup-all.sh mount-smb.sh setup.sh backup.conf redos-backup-manager.conf redos-backup-manager.cron redos-backup-manager.service redos-backup-manager.timer redos-backup-manager.desktop redos-backup-manager.png; do
    if [ ! -f "SOURCES/$f" ]; then
        echo "  ⚠ Отсутствует: SOURCES/$f"
        MISSING=$((MISSING + 1))
    fi
done

if [ ! -d "SOURCES/dist" ] || [ -z "$(ls -A SOURCES/dist 2>/dev/null)" ]; then
    echo "  ⚠ Отсутствует: SOURCES/dist/"
    MISSING=$((MISSING + 1))
fi

if [ $MISSING -gt 0 ]; then
    echo "ОШИБКА: Не найдено $MISSING файлов"
    exit 1
fi

echo "✓ Все файлы на месте"
echo ""

# ==========================================
# [6/7] Сборка RPM
# ==========================================
echo "[6/7] Сборка RPM пакета..."
rpmbuild -ba SPECS/$PKG_NAME.spec
echo "✓ RPM пакет собран"
echo ""

# ==========================================
# [7/7] Результат
# ==========================================
echo "[7/7] Результат сборки..."
echo ""
echo "=========================================="
echo " ✓ RPM пакет успешно собран!"
echo "=========================================="
echo ""
echo " Файл пакета:"

RPM_FILE=$(ls ~/rpmbuild/RPMS/noarch/$PKG_NAME-$PKG_VERSION-$PKG_RELEASE.*.rpm 2>/dev/null | head -1)
if [ -n "$RPM_FILE" ]; then
    ls -lh "$RPM_FILE"
    echo ""
    echo " Размер: $(du -h "$RPM_FILE" | cut -f1)"
    echo ""
    echo " Установка:"
    echo "   sudo dnf install $RPM_FILE"
else
    ls -lh ~/rpmbuild/RPMS/noarch/ 2>/dev/null || echo "  (проверьте ~/rpmbuild/RPMS/noarch/)"
fi

echo ""
echo " После установки:"
echo "   sudo /usr/share/redos-backup-manager/scripts/setup.sh"
echo ""
echo " Веб-интерфейс: http://localhost:8080"
echo " Ярлык в меню:  Приложения → Системные → Резервное копирование"
echo ""
echo "=========================================="
