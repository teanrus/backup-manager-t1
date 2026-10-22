import React, { useState } from 'react';
import { LogEntry } from './types';
import { formatTimestamp } from './api';

interface LogsPageProps {
  logs: LogEntry[];
}

export const LogsPage: React.FC<LogsPageProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const levelConfig = {
    info: { icon: 'fa-circle-info', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Информация' },
    success: { icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50', label: 'Успех' },
    warning: { icon: 'fa-triangle-exclamation', color: 'text-amber-500', bg: 'bg-amber-50', label: 'Предупреждение' },
    error: { icon: 'fa-circle-xmark', color: 'text-red-500', bg: 'bg-red-50', label: 'Ошибка' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Журнал событий</h2>
        <p className="text-slate-500 text-sm mt-1">История операций резервного копирования</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по журналу..."
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'success', 'info', 'warning', 'error'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                filter === level
                  ? 'bg-white text-slate-800 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {level === 'all' ? 'Все' : levelConfig[level].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-700">{logs.filter(l => l.level === 'success').length}</p>
          <p className="text-xs text-green-600">Успешных</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-700">{logs.filter(l => l.level === 'info').length}</p>
          <p className="text-xs text-blue-600">Информация</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-amber-700">{logs.filter(l => l.level === 'warning').length}</p>
          <p className="text-xs text-amber-600">Предупреждения</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-red-700">{logs.filter(l => l.level === 'error').length}</p>
          <p className="text-xs text-red-600">Ошибки</p>
        </div>
      </div>

      {/* Log Entries */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.map(log => {
            const config = levelConfig[log.level];
            return (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <i className={`fa-solid ${config.icon} ${config.color} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{log.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400 font-mono">{formatTimestamp(log.timestamp)}</span>
                      {log.jobName && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {log.jobName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-10 text-center">
            <i className="fa-solid fa-file-lines text-3xl text-slate-300 mb-3"></i>
            <p className="text-sm text-slate-500">Записи не найдены</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">Журнал сохраняется локально backend. Последние 1000 событий доступны в этом разделе.</p>
    </div>
  );
};
