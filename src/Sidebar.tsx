import React from 'react';
import { Page } from './types';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const menuItems: { page: Page; icon: string; label: string }[] = [
  { page: 'dashboard', icon: 'fa-gauge-high', label: 'Обзор' },
  { page: 'jobs', icon: 'fa-list-check', label: 'Задания' },
  { page: 'schedule', icon: 'fa-clock', label: 'Расписание' },
  { page: 'smb', icon: 'fa-server', label: 'SMB сервер' },
  { page: 'logs', icon: 'fa-file-lines', label: 'Журнал' },
  { page: 'settings', icon: 'fa-gear', label: 'Настройки' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-sm">РЕД ОС</h1>
            <p className="text-xs text-slate-400">Резервное копирование</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => onPageChange(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                  currentPage === item.page
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-user text-xs"></i>
          </div>
          <div>
            <p className="text-xs font-medium">user</p>
            <p className="text-xs text-slate-400">РЕД ОС 7.3</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
