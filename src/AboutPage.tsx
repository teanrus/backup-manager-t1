import React from 'react';

export const AboutPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-800">О программе</h2>
      <p className="text-slate-500 text-sm mt-1">Локальное управление резервными копиями</p>
    </div>

    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Backup Manager</h3>
          <p className="text-slate-500 mt-1">Управление заданиями резервного копирования каталогов на SMB/CIFS.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">React + Node.js</span>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">Локальный backend</span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">Linux backend</span>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Что умеет приложение</h3>
      <ul className="space-y-3 text-sm text-slate-600">
        <li><i className="fa-solid fa-check text-green-600 mr-2"></i>Хранить задания, SMB-параметры и настройки локально.</li>
        <li><i className="fa-solid fa-check text-green-600 mr-2"></i>Проверять доступ к SMB-ресурсу и запускать резервное копирование.</li>
        <li><i className="fa-solid fa-check text-green-600 mr-2"></i>Выполнять ежедневное, еженедельное и почасовое расписание.</li>
        <li><i className="fa-solid fa-check text-green-600 mr-2"></i>Показывать состояние заданий и журнал событий.</li>
      </ul>
      <p className="mt-5 text-sm text-slate-500">
        Для работы с SMB на Linux необходимы Node.js 18+, rsync, smbclient, cifs-utils и права на монтирование сетевых ресурсов.
      </p>
    </section>

    <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <h3 className="font-semibold text-blue-900 mb-2">Развитие проекта</h3>
      <p className="text-sm text-blue-800">
        Текущая реализация backend ориентирована на Linux. Кроссплатформенность планируется развивать отдельно, включая поддержку Astra Linux.
      </p>
    </section>
  </div>
);
