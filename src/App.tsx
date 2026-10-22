import React, { useState, useCallback } from 'react';
import { Page, BackupJob, LogEntry, SMBConfig } from './types';
import { initialSMBConfig, initialJobs, initialLogs } from './data';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { JobsPage } from './JobsPage';
import { SMBPage } from './SMBPage';
import { SchedulePage } from './SchedulePage';
import { LogsPage } from './LogsPage';
import { SettingsPage } from './SettingsPage';
import { AboutPage } from './AboutPage';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [smbConfig, setSmbConfig] = useState<SMBConfig>(initialSMBConfig);
  const [jobs, setJobs] = useState<BackupJob[]>(initialJobs);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

  const addLog = useCallback((level: LogEntry['level'], message: string, jobName?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('ru-RU', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(',', ''),
      level,
      message,
      jobName,
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const handleRunJob = useCallback((id: string) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    addLog('error', 'Веб-интерфейс не подключён к системному сервису и не может запускать резервное копирование. Используйте backup-all.sh.', job.name);
  }, [jobs, addLog]);

  const handleToggleJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        const newEnabled = !j.enabled;
        addLog('info', `Задание "${j.name}" ${newEnabled ? 'включено' : 'выключено'}`);
        return { ...j, enabled: newEnabled };
      }
      return j;
    }));
  }, [addLog]);

  const handleAddJob = useCallback((job: Omit<BackupJob, 'id' | 'lastRun' | 'lastStatus'>) => {
    const newJob: BackupJob = {
      ...job,
      id: Date.now().toString(),
      lastRun: null,
      lastStatus: 'never',
    };
    setJobs(prev => [...prev, newJob]);
    addLog('info', `Добавлено новое задание: "${job.name}" (${job.sourcePath})`);
  }, [addLog]);

  const handleDeleteJob = useCallback((id: string) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      setJobs(prev => prev.filter(j => j.id !== id));
      addLog('info', `Удалено задание: "${job.name}"`);
    }
  }, [jobs, addLog]);

  const handleUpdateSchedule = useCallback((id: string, schedule: BackupJob['schedule']) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return { ...j, schedule };
      }
      return j;
    }));
  }, []);

  const handleSaveSMB = useCallback((config: SMBConfig) => {
    setSmbConfig({ ...config, connected: false });
    addLog('warning', 'Изменения SMB сохранены только в памяти страницы и не записаны в системную конфигурацию.');
  }, [addLog]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard jobs={jobs} logs={logs} smbConfig={smbConfig} onRunJob={handleRunJob} />;
      case 'jobs':
        return <JobsPage jobs={jobs} onToggleJob={handleToggleJob} onRunJob={handleRunJob} onAddJob={handleAddJob} onDeleteJob={handleDeleteJob} />;
      case 'smb':
        return <SMBPage config={smbConfig} onSave={handleSaveSMB} />;
      case 'schedule':
        return <SchedulePage jobs={jobs} onUpdateSchedule={handleUpdateSchedule} />;
      case 'logs':
        return <LogsPage logs={logs} />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <Dashboard jobs={jobs} logs={logs} smbConfig={smbConfig} onRunJob={handleRunJob} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-5 bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-900">
          <strong>Демонстрационный интерфейс.</strong> Он не связан с системными скриптами: состояние SMB не проверяется, настройки не записываются в систему, а запуск из интерфейса не выполняет копирование. Для настройки используйте <code>sudo /usr/share/redos-backup-manager/scripts/setup.sh</code>; для реального запуска заданий — <code>sudo /usr/share/redos-backup-manager/scripts/backup-all.sh</code>.
        </div>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
