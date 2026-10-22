import React, { useState } from 'react';

interface SettingsState {
  compression: boolean;
  deleteExtra: boolean;
  verbose: boolean;
  bandwidthLimit: string;
  retries: number;
  notifyEmail: string;
  notifyOnError: boolean;
  notifyOnSuccess: boolean;
  logRetention: number;
  parallelJobs: number;
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    compression: true,
    deleteExtra: true,
    verbose: false,
    bandwidthLimit: '0',
    retries: 3,
    notifyEmail: '',
    notifyOnError: true,
    notifyOnSuccess: false,
    logRetention: 30,
    parallelJobs: 1,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
        <p className="text-slate-500 text-sm mt-1">Общие параметры системы резервного копирования</p>
      </div>

      {/* Rsync Options */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-600"></i>
          Параметры rsync
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Сжатие при передаче (-z)</p>
              <p className="text-xs text-slate-500">Сжимать данные при передаче по сети</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, compression: !settings.compression })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.compression ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.compression ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Удалять лишние файлы (--delete)</p>
              <p className="text-xs text-slate-500">Удалять в приёмнике файлы, отсутствующие в источнике</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, deleteExtra: !settings.deleteExtra })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.deleteExtra ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.deleteExtra ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Подробный вывод (-v)</p>
              <p className="text-xs text-slate-500">Выводить информацию о каждом обрабатываемом файле</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, verbose: !settings.verbose })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.verbose ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.verbose ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ограничение полосы (Мбит/с, 0 = без ограничений)</label>
              <input
                type="number"
                value={settings.bandwidthLimit}
                onChange={(e) => setSettings({ ...settings, bandwidthLimit: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Количество повторных попыток при ошибке</label>
              <input
                type="number"
                value={settings.retries}
                onChange={(e) => setSettings({ ...settings, retries: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Параллельных заданий</label>
            <input
              type="number"
              value={settings.parallelJobs}
              onChange={(e) => setSettings({ ...settings, parallelJobs: parseInt(e.target.value) || 1 })}
              min={1}
              max={4}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-bell text-amber-600"></i>
          Уведомления
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email для уведомлений</label>
            <input
              type="email"
              value={settings.notifyEmail}
              onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
              placeholder="admin@example.com"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Уведомлять об ошибках</p>
              <p className="text-xs text-slate-500">Отправлять email при сбое резервного копирования</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifyOnError: !settings.notifyOnError })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.notifyOnError ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifyOnError ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Уведомлять об успехе</p>
              <p className="text-xs text-slate-500">Отправлять email после успешного завершения</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notifyOnSuccess: !settings.notifyOnSuccess })}
              className={`w-12 h-6 rounded-full transition-colors ${settings.notifyOnSuccess ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notifyOnSuccess ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Log Retention */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-database text-green-600"></i>
          Хранение данных
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Хранить журналы (дней)</label>
          <input
            type="number"
            value={settings.logRetention}
            onChange={(e) => setSettings({ ...settings, logRetention: parseInt(e.target.value) || 30 })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          Сохранить настройки
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <i className="fa-solid fa-circle-check"></i> Настройки сохранены
          </span>
        )}
      </div>

      {/* Generated script */}
      <div className="bg-slate-800 rounded-xl p-5 text-white">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <i className="fa-solid fa-file-code text-green-400"></i>
          Скрипт резервного копирования (/usr/local/bin/backup.sh)
        </h4>
        <pre className="text-xs text-green-300 font-mono bg-slate-900 rounded-lg p-4 overflow-x-auto leading-relaxed">
{`#!/bin/bash
# РЕД ОС - Система резервного копирования
# Автоматически сгенерированный скрипт

SOURCE="$1"
DEST="/mnt/backup$(dirname "$SOURCE")"
LOG="/var/log/redos-backup/backup.log"
RETRIES=${settings.retries}

RSYNC_OPTS="-a ${settings.compression ? '-z ' : ''}${settings.verbose ? '-v ' : ''}--progress --log-file=$LOG"
${settings.deleteExtra ? 'RSYNC_OPTS="$RSYNC_OPTS --delete"' : ''}
${settings.bandwidthLimit !== '0' ? `RSYNC_OPTS="$RSYNC_OPTS --bwlimit=${settings.bandwidthLimit}000"` : ''}

# Проверка SMB подключения
if ! mountpoint -q /mnt/backup; then
    mount -t cifs //${'SERVER'}/share /mnt/backup -o credentials=/etc/samba/credentials
fi

# Выполнение с повторными попытками
for i in $(seq 1 $RETRIES); do
    rsync $RSYNC_OPTS "$SOURCE/" "$DEST/" && break
    echo "$(date): Попытка $i не удалась" >> $LOG
    sleep 60
done`}
        </pre>
      </div>
    </div>
  );
};
