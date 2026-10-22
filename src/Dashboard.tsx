import React from 'react';
import { BackupJob, LogEntry, SMBConfig } from './types';

interface DashboardProps {
  jobs: BackupJob[];
  logs: LogEntry[];
  smbConfig: SMBConfig;
  onRunJob: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, logs, smbConfig, onRunJob }) => {
  const totalSize = jobs.reduce((acc, job) => {
    const num = parseFloat(job.size);
    if (job.size.includes('ГБ')) return acc + num * 1024;
    return acc + num;
  }, 0);

  const totalFiles = jobs.reduce((acc, job) => acc + job.filesCount, 0);
  const activeJobs = jobs.filter((j) => j.enabled).length;
  const successJobs = jobs.filter((j) => j.lastStatus === 'success').length;
  const errorJobs = jobs.filter((j) => j.lastStatus === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Обзор</h2>
          <p className="text-slate-500 text-sm mt-1">Состояние системы резервного копирования</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-700">Система активна</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Активных заданий</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{activeJobs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-list-check text-blue-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Объём данных</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{(totalSize / 1024).toFixed(1)} ГБ</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-database text-purple-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Всего файлов</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalFiles.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-file text-amber-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Успешных</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{successJobs}/{jobs.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-green-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* SMB Status + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMB Connection */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-server text-blue-600"></i>
            SMB подключение
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${smbConfig.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${smbConfig.connected ? 'text-green-700' : 'text-red-700'}`}>
                {smbConfig.connected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs text-slate-500">Сервер: <span className="text-slate-700 font-mono">{smbConfig.server}</span></p>
              <p className="text-xs text-slate-500">Ресурс: <span className="text-slate-700 font-mono">{smbConfig.share}</span></p>
              <p className="text-xs text-slate-500">Точка монтирования: <span className="text-slate-700 font-mono">{smbConfig.mountPoint}</span></p>
              <p className="text-xs text-slate-500">Пользователь: <span className="text-slate-700 font-mono">{smbConfig.username}</span></p>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-purple-600"></i>
            Последние задания
          </h3>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    job.lastStatus === 'success' ? 'bg-green-500' :
                    job.lastStatus === 'error' ? 'bg-red-500' :
                    job.lastStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                    'bg-slate-300'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{job.name}</p>
                    <p className="text-xs text-slate-400">{job.sourcePath}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{job.size}</span>
                  <button
                    onClick={() => onRunJob(job.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className="fa-solid fa-play mr-1"></i> Запустить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorJobs > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-triangle-exclamation text-red-500 mt-0.5"></i>
          <div>
            <p className="text-sm font-medium text-red-800">Обнаружены ошибки</p>
            <p className="text-xs text-red-600 mt-1">
              {errorJobs} {errorJobs === 1 ? 'задание завершилось' : 'заданий завершилось'} с ошибкой. Проверьте журнал для подробностей.
            </p>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-file-lines text-slate-600"></i>
          Последние записи журнала
        </h3>
        <div className="space-y-2">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                log.level === 'success' ? 'bg-green-500' :
                log.level === 'error' ? 'bg-red-500' :
                log.level === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              }`}></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{log.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{log.timestamp} {log.jobName && `• ${log.jobName}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
