import React, { useState, useCallback, useEffect } from 'react';
import { Page, BackupJob, SMBConfig } from './types';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { JobsPage } from './JobsPage';
import { SMBPage } from './SMBPage';
import { SchedulePage } from './SchedulePage';
import { LogsPage } from './LogsPage';
import { SettingsPage } from './SettingsPage';
import { AboutPage } from './AboutPage';
import { api, AppState, BackupSettings } from './api';

const emptyState: AppState = {
  jobs: [],
  logs: [],
  smbConfig: { server: '', share: '', username: '', password: '', domain: 'WORKGROUP', mountPoint: '/mnt/backup', connected: false },
  settings: {
    compression: true, deleteExtra: false, verbose: false, bandwidthLimit: 0, retries: 3,
    notifyEmail: '', notifyOnError: true, notifyOnSuccess: false, logRetention: 30, parallelJobs: 1,
  },
  backend: { platform: 'unknown', canRunBackups: false },
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [appState, setAppState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [operationError, setOperationError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setAppState(await api.getState());
      setConnectionError('');
    } catch (refreshError) {
      setConnectionError(refreshError instanceof Error ? refreshError.message : 'Не удалось связаться с backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const perform = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    try {
      await operation();
      await refresh();
      setOperationError('');
      return true;
    } catch (operationError) {
      setOperationError(operationError instanceof Error ? operationError.message : 'Операция не выполнена.');
      return false;
    }
  }, [refresh]);

  const handleRunJob = useCallback((id: string) => {
    void perform(() => api.runJob(id));
  }, [perform]);

  const handleToggleJob = useCallback((id: string) => {
    const job = appState.jobs.find(item => item.id === id);
    if (job) void perform(() => api.updateJob(id, { enabled: !job.enabled }));
  }, [appState.jobs, perform]);

  const handleAddJob = useCallback((job: Omit<BackupJob, 'id' | 'lastRun' | 'lastStatus' | 'size' | 'filesCount'>) => {
    void perform(() => api.addJob(job));
  }, [perform]);

  const handleDeleteJob = useCallback((id: string) => {
    void perform(() => api.deleteJob(id));
  }, [perform]);

  const handleUpdateSchedule = useCallback((id: string, schedule: BackupJob['schedule']) => {
    void perform(() => api.updateJob(id, { schedule }));
  }, [perform]);

  const handleSaveSMB = useCallback((config: SMBConfig) => {
    return perform(() => api.saveSmb(config));
  }, [perform]);

  const handleTestSMB = useCallback(() => perform(() => api.testSmb()), [perform]);

  const handleSaveSettings = useCallback((settings: BackupSettings) => {
    return perform(() => api.saveSettings(settings));
  }, [perform]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard jobs={appState.jobs} logs={appState.logs} smbConfig={appState.smbConfig} onRunJob={handleRunJob} canRunBackups={appState.backend.canRunBackups} />;
      case 'jobs':
        return <JobsPage jobs={appState.jobs} onToggleJob={handleToggleJob} onRunJob={handleRunJob} onAddJob={handleAddJob} onDeleteJob={handleDeleteJob} canRunBackups={appState.backend.canRunBackups} />;
      case 'smb':
        return <SMBPage config={appState.smbConfig} onSave={handleSaveSMB} onTest={handleTestSMB} />;
      case 'schedule':
        return <SchedulePage jobs={appState.jobs} onUpdateSchedule={handleUpdateSchedule} />;
      case 'logs':
        return <LogsPage logs={appState.logs} />;
      case 'settings':
        return <SettingsPage settings={appState.settings} onSave={handleSaveSettings} />;
      case 'about':
        return <AboutPage />;
      default:
        return <Dashboard jobs={appState.jobs} logs={appState.logs} smbConfig={appState.smbConfig} onRunJob={handleRunJob} canRunBackups={appState.backend.canRunBackups} />;
    }
  };
  const error = operationError || connectionError;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 p-6 overflow-auto">
        {loading && <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Подключаемся к локальному backend…</div>}
        {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <span>{error}</span>
          <button className="font-medium underline" onClick={() => { setOperationError(''); void refresh(); }}>Повторить</button>
        </div>}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
