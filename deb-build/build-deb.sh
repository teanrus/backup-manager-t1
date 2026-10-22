#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="backup-manager"
BUILD_DIR="$(mktemp -d)"
PACKAGE_ROOT="$BUILD_DIR/package"

cleanup() {
    rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

for command in node npm dpkg-deb; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Ошибка: не найдена команда $command. Сборку выполняйте на Debian/Ubuntu с установленным dpkg." >&2
        exit 1
    fi
done

cd "$PROJECT_DIR"
VERSION="$(node -p "JSON.parse(require('node:fs').readFileSync('package.json', 'utf8')).version")"
OUTPUT_DIR="$PROJECT_DIR/dist/packages"
OUTPUT_FILE="$OUTPUT_DIR/${PACKAGE_NAME}_${VERSION}_all.deb"

npm ci
npm run build

mkdir -p \
    "$PACKAGE_ROOT/DEBIAN" \
    "$PACKAGE_ROOT/usr/share/backup-manager/web" \
    "$PACKAGE_ROOT/usr/share/backup-manager/server" \
    "$PACKAGE_ROOT/usr/share/backup-manager/scripts" \
    "$PACKAGE_ROOT/etc/nginx/conf.d" \
    "$PACKAGE_ROOT/usr/lib/systemd/system" \
    "$PACKAGE_ROOT/var/lib/backup-manager" \
    "$PACKAGE_ROOT/var/log/backup-manager"

cp -a "$PROJECT_DIR/dist/." "$PACKAGE_ROOT/usr/share/backup-manager/web/"
install -m 644 "$PROJECT_DIR/server/index.js" "$PACKAGE_ROOT/usr/share/backup-manager/server/index.js"
install -m 755 "$SCRIPT_DIR/setup.sh" "$PACKAGE_ROOT/usr/share/backup-manager/scripts/setup.sh"
install -m 644 "$SCRIPT_DIR/backup-manager-api.service" "$PACKAGE_ROOT/usr/lib/systemd/system/backup-manager-api.service"
install -m 644 "$SCRIPT_DIR/backup-manager.conf" "$PACKAGE_ROOT/etc/nginx/conf.d/backup-manager.conf"
install -m 644 "$SCRIPT_DIR/DEBIAN/conffiles" "$PACKAGE_ROOT/DEBIAN/conffiles"
install -m 755 "$SCRIPT_DIR/DEBIAN/postinst" "$PACKAGE_ROOT/DEBIAN/postinst"
install -m 755 "$SCRIPT_DIR/DEBIAN/prerm" "$PACKAGE_ROOT/DEBIAN/prerm"
install -m 755 "$SCRIPT_DIR/DEBIAN/postrm" "$PACKAGE_ROOT/DEBIAN/postrm"
sed "s/^Version: .*/Version: $VERSION/" "$SCRIPT_DIR/DEBIAN/control" > "$PACKAGE_ROOT/DEBIAN/control"

chmod 755 "$PACKAGE_ROOT/var/lib/backup-manager"
chmod 755 "$PACKAGE_ROOT/var/log/backup-manager"

mkdir -p "$OUTPUT_DIR"
dpkg-deb --build --root-owner-group "$PACKAGE_ROOT" "$OUTPUT_FILE"

echo "Debian пакет собран: $OUTPUT_FILE"
