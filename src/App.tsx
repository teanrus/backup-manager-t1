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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [smbConfig, setSmbConfig] = useState<SMBConfig>(initialSMBConfig);
  const [jobs, setJobs] = useState<BackupJob[]>(initialJobs);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

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

    setRunningJobs(prev => new Set(prev).add(id));
    addLog('info', `Начало резервного копирования (запущено вручную)`, job.name);

    // Simulate backup process
    setTimeout(() => {
      const success = Math.random() > 0.15;
      setRunningJobs(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setJobs(prev => prev.map(j => {
        if (j.id === id) {
          return {
            ...j,
            lastRun: new Date().toLocaleString('ru-RU', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(',', ''),
            lastStatus: success ? 'success' : 'error',
          };
        }
        return j;
      }));

      if (success) {
        addLog('success', `Резервное копирование завершено успешно. Синхронизировано файлов: ${job.filesCount}`, job.name);
      } else {
        addLog('error', `Ошибка: SMB подключение потеряно во время выполнения`, job.name);
      }
    }, 2000 + Math.random() * 2000);
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
    setSmbConfig(config);
    addLog('info', `Настройки SMB обновлены: //${config.server}/${config.share}`);
  }, [addLog]);

  const handleTestConnection = useCallback(() => {
    addLog('success', `SMB подключение проверено: //${smbConfig.server}/${smbConfig.share} — доступно`);
  }, [smbConfig, addLog]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard jobs={jobs} logs={logs} smbConfig={smbConfig} onRunJob={handleRunJob} />;
      case 'jobs':
        return <JobsPage jobs={jobs} onToggleJob={handleToggleJob} onRunJob={handleRunJob} onAddJob={handleAddJob} onDeleteJob={handleDeleteJob} />;
      case 'smb':
        return <SMBPage config={smbConfig} onSave={handleSaveSMB} onTestConnection={handleTestConnection} />;
      case 'schedule':
        return <SchedulePage jobs={jobs} onUpdateSchedule={handleUpdateSchedule} />;
      case 'logs':
        return <LogsPage logs={logs} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard jobs={jobs} logs={logs} smbConfig={smbConfig} onRunJob={handleRunJob} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 p-6 overflow-auto">
        {/* Running jobs notification */}
        {runningJobs.size > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <i className="fa-solid fa-spinner fa-spin text-blue-600"></i>
            <span className="text-sm text-blue-700">
              Выполняется резервное копирование: {runningJobs.size} {runningJobs.size === 1 ? 'задание' : 'заданий'}
            </span>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
