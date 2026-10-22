import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">О программе</h2>
        <p className="text-slate-500 text-sm mt-1">Информация о системе и пакете</p>
      </div>

      {/* Package Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">РЕД ОС — Резервное копирование</h3>
            <p className="text-slate-500 mt-1">Система резервного копирования каталогов пользователя на удалённый SMB сервер</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">v1.0.0</span>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">RPM пакет</span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">РЕД ОС 7.3+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-download text-blue-600"></i>
          Установка RPM пакета
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">1. Сборка пакета:</p>
            <div className="bg-slate-800 rounded-lg p-3">
              <code className="text-xs text-green-300 font-mono">
                <span className="text-slate-400"># Установка зависимостей для сборки</span><br/>
                sudo dnf install nodejs npm rpm-build<br/><br/>
                <span className="text-slate-400"># Сборка RPM</span><br/>
                cd redos-backup-manager<br/>
                chmod +x rpm-build/build-rpm.sh<br/>
                ./rpm-build/build-rpm.sh
              </code>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">2. Установка:</p>
            <div className="bg-slate-800 rounded-lg p-3">
              <code className="text-xs text-green-300 font-mono">
                sudo dnf install ~/rpmbuild/RPMS/noarch/redos-backup-manager-1.0.0-1.noarch.rpm
              </code>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">3. Первоначальная настройка:</p>
            <div className="bg-slate-800 rounded-lg p-3">
              <code className="text-xs text-green-300 font-mono">
                sudo /usr/share/redos-backup-manager/scripts/setup.sh
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-puzzle-piece text-amber-600"></i>
          Зависимости пакета
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'nginx', desc: 'Веб-сервер для интерфейса', port: '8080' },
            { name: 'rsync', desc: 'Утилита синхронизации файлов', port: null },
            { name: 'cifs-utils', desc: 'Утилиты для SMB/CIFS', port: null },
            { name: 'samba-client', desc: 'Клиент SMB', port: null },
            { name: 'cronie', desc: 'Планировщик задач', port: null },
            { name: 'systemd', desc: 'Система инициализации', port: null },
            { name: 'nmap', desc: 'Диагностика сети', port: null },
          ].map(dep => (
            <div key={dep.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                <i className="fa-solid fa-cube text-slate-500 text-xs"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{dep.name}</p>
                <p className="text-xs text-slate-500">{dep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Structure */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-folder-tree text-green-600"></i>
          Структура установленных файлов
        </h3>
        <div className="bg-slate-800 rounded-lg p-4">
          <pre className="text-xs text-green-300 font-mono leading-relaxed">
{`/usr/share/redos-backup-manager/
├── web/                         # Веб-интерфейс
├── scripts/
│   ├── backup.sh               # Копирование одного каталога
│   ├── backup-all.sh           # Копирование всех каталогов
│   ├── mount-smb.sh            # Монтирование SMB
│   ├── setup.sh                # Первоначальная настройка
│   └── uninstall.sh            # Полное удаление
└── icons/
    └── redos-backup-manager.png

/etc/redos-backup-manager/
├── backup.conf                 # Конфигурация
└── smb-credentials             # Учётные данные (600)

/etc/nginx/conf.d/
└── redos-backup-manager.conf   # Nginx (порт 8080)

/etc/cron.d/
└── redos-backup-manager        # Cron задание

/usr/lib/systemd/system/
├── redos-backup-manager.service
└── redos-backup-manager.timer  # Ежедневно в 03:00

/usr/share/applications/
└── redos-backup-manager.desktop  # Ярлык в меню

/var/log/redos-backup/
├── backup.log                  # Журнал операций
└── rsync.log                   # Журнал rsync`}
          </pre>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-gears text-indigo-600"></i>
          Управление сервисами
        </h3>
        <div className="bg-slate-800 rounded-lg p-4 space-y-2">
          <code className="text-xs text-green-300 font-mono block">
            <span className="text-slate-400"># Статус таймера</span><br/>
            systemctl status redos-backup-manager.timer<br/><br/>
            <span className="text-slate-400"># Ручной запуск копирования</span><br/>
            sudo systemctl start redos-backup-manager.service<br/><br/>
            <span className="text-slate-400"># Просмотр логов</span><br/>
            journalctl -u redos-backup-manager.service -f<br/><br/>
            <span className="text-slate-400"># Изменить расписание</span><br/>
            sudo systemctl edit redos-backup-manager.timer
          </code>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-400">
          РЕД ОС — Резервное копирование v1.0.0 • MIT License • 2026
        </p>
      </div>
    </div>
  );
};
