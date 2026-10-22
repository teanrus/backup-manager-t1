import React, { useState } from 'react';
import { SMBConfig } from './types';

interface SMBPageProps {
  config: SMBConfig;
  onSave: (config: SMBConfig) => void;
}

export const SMBPage: React.FC<SMBPageProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<SMBConfig>({ ...config });
  const [testAttempted, setTestAttempted] = useState(false);

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки SMB сервера</h2>
        <p className="text-slate-500 text-sm mt-1">Конфигурация подключения к удалённому SMB/CIFS серверу</p>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl p-5 border bg-amber-50 border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
            <i className="fa-solid fa-circle-question text-amber-700 text-xl"></i>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Состояние SMB не проверяется</p>
            <p className="text-sm text-amber-800">Веб-интерфейс не подключён к системному сервису.</p>
          </div>
        </div>
      </div>

      {/* Config Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-600"></i>
          Параметры подключения
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">IP-адрес или имя сервера</label>
            <input
              type="text"
              value={localConfig.server}
              onChange={(e) => setLocalConfig({ ...localConfig, server: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="192.168.1.100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя общего ресурса (share)</label>
            <input
              type="text"
              value={localConfig.share}
              onChange={(e) => setLocalConfig({ ...localConfig, share: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="backups"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя пользователя</label>
            <input
              type="text"
              value={localConfig.username}
              onChange={(e) => setLocalConfig({ ...localConfig, username: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="backup_user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
            <input
              type="password"
              value={localConfig.password}
              onChange={(e) => setLocalConfig({ ...localConfig, password: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Домен / Рабочая группа</label>
            <input
              type="text"
              value={localConfig.domain}
              onChange={(e) => setLocalConfig({ ...localConfig, domain: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="WORKGROUP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Точка монтирования</label>
            <input
              type="text"
              value={localConfig.mountPoint}
              onChange={(e) => setLocalConfig({ ...localConfig, mountPoint: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="/mnt/backup"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            Сохранить
          </button>
          <button
            onClick={() => setTestAttempted(true)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <i className="fa-solid fa-plug"></i> Проверить подключение
          </button>
          {testAttempted && (
            <span className="text-sm text-amber-700 flex items-center gap-1">
              <i className="fa-solid fa-circle-info"></i> Проверка недоступна: нужен системный backend.
            </span>
          )}
        </div>
      </div>

      {/* Mount Command */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-terminal text-slate-600"></i>
          Команда монтирования
        </h3>
        <div className="bg-slate-800 rounded-lg p-4">
          <code className="text-sm text-green-300 font-mono block overflow-x-auto">
            <span className="text-slate-400"># /etc/fstab запись:</span><br/>
            //{localConfig.server}/{localConfig.share} {localConfig.mountPoint} cifs \<br/>
            &nbsp;&nbsp;username={localConfig.username},password=****,domain={localConfig.domain},\<br/>
            &nbsp;&nbsp;iocharset=utf8,file_mode=0700,dir_mode=0700,_netdev 0 0
          </code>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 mt-3">
          <code className="text-sm text-green-300 font-mono block overflow-x-auto">
            <span className="text-slate-400"># Ручное монтирование:</span><br/>
            sudo mount -t cifs //{localConfig.server}/{localConfig.share} {localConfig.mountPoint} \<br/>
            &nbsp;&nbsp;-o username={localConfig.username},domain={localConfig.domain}
          </code>
        </div>
      </div>

      {/* Required packages */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-2">
          <i className="fa-solid fa-circle-info"></i>
          Необходимые пакеты РЕД ОС
        </h4>
        <div className="bg-white/50 rounded-lg p-3">
          <code className="text-xs text-slate-700 font-mono">
            sudo apt-get install cifs-utils rsync samba-client
          </code>
        </div>
      </div>
    </div>
  );
};
