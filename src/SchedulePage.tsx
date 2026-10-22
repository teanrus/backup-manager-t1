import React from 'react';
import { BackupJob } from './types';

interface SchedulePageProps {
  jobs: BackupJob[];
  onUpdateSchedule: (id: string, schedule: BackupJob['schedule']) => void;
}

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export const SchedulePage: React.FC<SchedulePageProps> = ({ jobs, onUpdateSchedule }) => {
  const enabledJobs = jobs.filter(j => j.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Расписание</h2>
        <p className="text-slate-500 text-sm mt-1">Настройка автоматического запуска резервного копирования</p>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-calendar-week text-blue-600"></i>
          Недельное расписание
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-slate-500 font-medium py-2">Время</div>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-xs text-slate-500 font-medium py-2 text-center">{day}</div>
              ))}
            </div>
            {/* Time slots */}
            {['00:00', '03:00', '06:00', '08:00', '12:00', '15:00', '18:00', '21:00', '22:00'].map(time => (
              <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-xs text-slate-400 py-2 font-mono">{time}</div>
                {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                  const hasJob = enabledJobs.some(j => {
                    if (j.schedule.type === 'daily' && j.schedule.time === time) return true;
                    if (j.schedule.type === 'weekly' && j.schedule.time === time && j.schedule.dayOfWeek === dayIdx) return true;
                    return false;
                  });
                  const job = enabledJobs.find(j => {
                    if (j.schedule.type === 'daily' && j.schedule.time === time) return j;
                    if (j.schedule.type === 'weekly' && j.schedule.time === time && j.schedule.dayOfWeek === dayIdx) return j;
                    return undefined;
                  });
                  return (
                    <div
                      key={dayIdx}
                      className={`py-2 rounded text-center text-xs ${
                        hasJob ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-slate-50 text-slate-300'
                      }`}
                      title={job ? `${job.name} (${job.sourcePath})` : ''}
                    >
                      {hasJob ? job?.name?.substring(0, 8) : '—'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Schedules */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fa-solid fa-list text-purple-600"></i>
          Расписания заданий
        </h3>
        <div className="space-y-4">
          {enabledJobs.map(job => (
            <div key={job.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-folder text-blue-600"></i>
                  <span className="font-medium text-slate-800">{job.name}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">
                  {job.schedule.type === 'daily' ? 'Ежедневно' :
                   job.schedule.type === 'weekly' ? 'Еженедельно' :
                   job.schedule.type === 'hourly' ? 'Каждый час' :
                   job.schedule.type === 'manual' ? 'Вручную' : 'Cron'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Тип расписания</label>
                  <select
                    value={job.schedule.type}
                    onChange={(e) => onUpdateSchedule(job.id, { ...job.schedule, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="manual">Вручную</option>
                    <option value="hourly">Каждый час</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                  </select>
                </div>
                {job.schedule.type !== 'manual' && job.schedule.type !== 'hourly' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Время</label>
                    <input
                      type="time"
                      value={job.schedule.time || '03:00'}
                      onChange={(e) => onUpdateSchedule(job.id, { ...job.schedule, time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
                {job.schedule.type === 'weekly' && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">День недели</label>
                    <select
                      value={job.schedule.dayOfWeek || 0}
                      onChange={(e) => onUpdateSchedule(job.id, { ...job.schedule, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {dayNames.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cron info */}
      <div className="bg-slate-800 rounded-xl p-5 text-white">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <i className="fa-solid fa-clock text-amber-400"></i>
          Генерируемые cron-задачи
        </h4>
        <div className="bg-slate-900 rounded-lg p-3 space-y-1">
          {enabledJobs.filter(j => j.schedule.type !== 'manual').map(job => (
            <code key={job.id} className="text-xs text-green-300 font-mono block">
              {job.schedule.type === 'hourly' ? '0 * * * *' :
               job.schedule.type === 'daily' ? `${job.schedule.time?.split(':')[1]} ${job.schedule.time?.split(':')[0]} * * *` :
               `${job.schedule.time?.split(':')[1]} ${job.schedule.time?.split(':')[0]} * * ${job.schedule.dayOfWeek}`}
              <span className="text-slate-400"> /usr/local/bin/backup.sh "{job.sourcePath}"</span>
            </code>
          ))}
        </div>
      </div>
    </div>
  );
};
