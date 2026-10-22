import React, { useEffect, useRef, useState } from 'react';
import { SMBConfig } from './types';

interface SMBPageProps {
  config: SMBConfig;
  onSave: (config: SMBConfig) => Promise<boolean>;
  onTest: () => Promise<boolean>;
}

function configKey(value: SMBConfig): string {
  return JSON.stringify([
    value.server, value.share, value.username, value.domain, value.mountPoint, value.passwordConfigured,
  ]);
}

export const SMBPage: React.FC<SMBPageProps> = ({ config, onSave, onTest }) => {
  const [localConfig, setLocalConfig] = useState<SMBConfig>({ ...config });
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const lastConfigKey = useRef(configKey(config));

  useEffect(() => {
    const nextKey = configKey(config);
    if (lastConfigKey.current !== nextKey) {
      lastConfigKey.current = nextKey;
      setLocalConfig({ ...config, password: '' });
    }
  }, [config]);

  const update = (changes: Partial<SMBConfig>) => {
    setLocalConfig(current => ({ ...current, ...changes }));
    setTestMessage('');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMessage('');
    try {
      const saved = await onSave(localConfig);
      const succeeded = saved && await onTest();
      setTestMessage(succeeded ? 'Подключение проверено успешно.' : '');
    } finally {
      setTesting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
  const fields: Array<{
    key: 'server' | 'share' | 'username' | 'password' | 'domain' | 'mountPoint';
    label: string;
    placeholder: string;
    type?: string;
  }> = [
    { key: 'server', label: 'Сервер', placeholder: '192.168.1.100' },
    { key: 'share', label: 'Общий ресурс', placeholder: 'backups' },
    { key: 'username', label: 'Имя пользователя', placeholder: 'backup_user' },
    { key: 'password', label: 'Пароль', placeholder: config.passwordConfigured ? 'Оставьте пустым, чтобы сохранить текущий' : 'Пароль SMB (необязательно для гостевого доступа)', type: 'password' },
    { key: 'domain', label: 'Домен / рабочая группа', placeholder: 'WORKGROUP' },
    { key: 'mountPoint', label: 'Точка монтирования', placeholder: '/mnt/backup' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки SMB сервера</h2>
        <p className="text-slate-500 text-sm mt-1">Параметры подключения к удалённому SMB/CIFS ресурсу</p>
      </div>

      <div className={`rounded-xl p-5 border ${config.connected ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <i className={`fa-solid ${config.connected ? 'fa-circle-check text-green-700' : 'fa-circle-question text-slate-600'} text-xl`}></i>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{config.connected ? 'Последняя проверка SMB прошла успешно' : 'Подключение ещё не проверялось'}</p>
            <p className="text-sm text-slate-600">
              {config.passwordConfigured ? 'Пароль сохранён локально и не возвращается веб-интерфейсу.' : 'Укажите параметры и сохраните их перед проверкой.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-600"></i>
          Параметры подключения
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={localConfig[field.key]}
                onChange={event => update({ [field.key]: event.target.value })}
                className={`${inputClass} ${field.key === 'server' || field.key === 'share' || field.key === 'mountPoint' ? 'font-mono' : ''}`}
                placeholder={field.placeholder}
                autoComplete={field.key === 'password' ? 'new-password' : undefined}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={() => void onSave(localConfig)}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            Сохранить
          </button>
          <button
            onClick={() => void handleTest()}
            disabled={testing}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <i className="fa-solid fa-plug"></i>
            {testing ? 'Проверка…' : 'Сохранить и проверить'}
          </button>
          {testMessage && <span role="status" className="text-sm text-green-700">{testMessage}</span>}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Backend хранит пароль в локальном каталоге приложения с ограниченными правами доступа. При запуске задания ресурс подключается автоматически; нужны Linux, cifs-utils, rsync и smbclient.
      </p>
    </div>
  );
};
