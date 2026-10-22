import React, { useEffect, useState } from 'react';
import { BackupSettings } from './api';

interface SettingsPageProps {
  settings: BackupSettings;
  onSave: (settings: BackupSettings) => Promise<boolean>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings: savedSettings, onSave }) => {
  const [settings, setSettings] = useState(savedSettings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!dirty) setSettings(savedSettings);
  }, [savedSettings, dirty]);

  const update = (changes: Partial<BackupSettings>) => {
    setSettings(current => ({ ...current, ...changes }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(settings);
    setSaving(false);
    if (success) {
      setDirty(false);
      setSaved(true);
    }
  };

  const toggle = (label: string, enabled: boolean, onClick: () => void) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onClick}
        className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Настройки</h2>
        <p className="text-slate-500 text-sm mt-1">Параметры резервного копирования и журналирования</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-blue-600"></i>
          Параметры rsync
        </h3>
        <div className="space-y-4">
          {toggle('Сжатие при передаче (-z)', settings.compression, () => update({ compression: !settings.compression }))}
          {toggle('Удалять лишние файлы в копии (--delete)', settings.deleteExtra, () => update({ deleteExtra: !settings.deleteExtra }))}
          {toggle('Подробный вывод (-v)', settings.verbose, () => update({ verbose: !settings.verbose }))}
          <p className="text-xs text-amber-700">При включении удаления файлы в резервной копии, отсутствующие в исходном каталоге, будут удалены.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ограничение скорости (Мбит/с, 0 — без ограничений)</label>
              <input
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={settings.bandwidthLimit}
                onChange={event => update({ bandwidthLimit: Number(event.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Попытки при ошибке (1–10)</label>
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={settings.retries}
                onChange={event => update({ retries: Number(event.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-database text-green-600"></i>
          Хранение журнала
        </h3>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Хранить записи (дней)</label>
        <input
          type="number"
          min={1}
          max={3650}
          value={settings.logRetention}
          onChange={event => update({ logRetention: Number(event.target.value) })}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          {saving ? 'Сохранение…' : 'Сохранить настройки'}
        </button>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Сохранено</span>}
      </div>
    </div>
  );
};
