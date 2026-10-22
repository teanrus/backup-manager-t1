import React, { useState } from 'react';
import { BackupJob, ScheduleConfig } from './types';

interface JobsPageProps {
  jobs: BackupJob[];
  onToggleJob: (id: string) => void;
  onRunJob: (id: string) => void;
  onAddJob: (job: Omit<BackupJob, 'id' | 'lastRun' | 'lastStatus' | 'size' | 'filesCount'>) => void;
  onDeleteJob: (id: string) => void;
  canRunBackups: boolean;
}

const scheduleLabels: Record<string, string> = {
  manual: 'Вручную',
  hourly: 'Каждый час',
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  custom: 'По cron',
};

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export const JobsPage: React.FC<JobsPageProps> = ({ jobs, onToggleJob, onRunJob, onAddJob, onDeleteJob, canRunBackups }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState<Omit<BackupJob, 'id' | 'lastRun' | 'lastStatus' | 'size' | 'filesCount'>>({
    name: '',
    sourcePath: '',
    enabled: true,
    schedule: { type: 'daily', time: '03:00', dayOfWeek: 1 },
  });

  const handleAdd = () => {
    if (newJob.name && newJob.sourcePath) {
      onAddJob(newJob);
      setShowAddForm(false);
      setNewJob({ name: '', sourcePath: '', enabled: true, schedule: { type: 'daily', time: '03:00', dayOfWeek: 1 } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Задания резервного копирования</h2>
          <p className="text-slate-500 text-sm mt-1">Управление каталогами для резервного копирования</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Добавить задание
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Новое задание</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Название</label>
              <input
                type="text"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                placeholder="Например: Проекты"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Путь к каталогу</label>
              <input
                type="text"
                value={newJob.sourcePath}
                onChange={(e) => setNewJob({ ...newJob, sourcePath: e.target.value })}
                placeholder="/home/user/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Расписание</label>
              <select
                value={newJob.schedule.type}
                onChange={(e) => setNewJob({ ...newJob, schedule: { ...newJob.schedule, type: e.target.value as ScheduleConfig['type'] } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="manual">Вручную</option>
                <option value="hourly">Каждый час</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Время выполнения</label>
              <input
                type="time"
                value={newJob.schedule.time}
                onChange={(e) => setNewJob({ ...newJob, schedule: { ...newJob.schedule, time: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            {newJob.schedule.type === 'weekly' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">День недели</label>
                <select
                  value={newJob.schedule.dayOfWeek}
                  onChange={event => setNewJob({ ...newJob, schedule: { ...newJob.schedule, dayOfWeek: Number(event.target.value) } })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {dayNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Сохранить
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
            job.lastStatus === 'error' ? 'border-red-200' : 'border-slate-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  job.enabled ? 'bg-blue-50' : 'bg-slate-100'
                }`}>
                  <i className={`fa-solid fa-folder ${job.enabled ? 'text-blue-600' : 'text-slate-400'}`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{job.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      job.lastStatus === 'success' ? 'bg-green-100 text-green-700' :
                      job.lastStatus === 'error' ? 'bg-red-100 text-red-700' :
                      job.lastStatus === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {job.lastStatus === 'success' ? 'Успешно' :
                       job.lastStatus === 'error' ? 'Ошибка' :
                       job.lastStatus === 'running' ? 'Выполняется' : 'Не запускалось'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{job.sourcePath}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">
                      <i className="fa-regular fa-clock mr-1"></i>
                      {scheduleLabels[job.schedule.type]} {job.schedule.time ? `в ${job.schedule.time}` : ''}
                    </span>
                    <span className="text-xs text-slate-400">
                      <i className="fa-solid fa-hard-drive mr-1"></i>
                      {job.size}
                    </span>
                    <span className="text-xs text-slate-400">
                      <i className="fa-solid fa-file mr-1"></i>
                      {job.filesCount.toLocaleString()} файлов
                    </span>
                    {job.lastRun && (
                      <span className="text-xs text-slate-400">
                        <i className="fa-solid fa-calendar mr-1"></i>
                        {job.lastRun}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRunJob(job.id)}
                  disabled={!canRunBackups || job.lastStatus === 'running'}
                  title={!canRunBackups ? 'Запуск резервного копирования поддерживается в Linux' : undefined}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-play"></i> Запустить
                </button>
                <button
                  onClick={() => onToggleJob(job.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                    job.enabled
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className={`fa-solid ${job.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  {job.enabled ? 'Вкл' : 'Выкл'}
                </button>
                <button
                  onClick={() => onDeleteJob(job.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">Каждое задание копируется в отдельный каталог резервного SMB-ресурса.</p>
    </div>
  );
};
