import { BackupJob, LogEntry, SMBConfig } from './types';

export interface BackupSettings {
  compression: boolean;
  deleteExtra: boolean;
  verbose: boolean;
  bandwidthLimit: number;
  retries: number;
  notifyEmail: string;
  notifyOnError: boolean;
  notifyOnSuccess: boolean;
  logRetention: number;
  parallelJobs: number;
}

export interface AppState {
  jobs: BackupJob[];
  logs: LogEntry[];
  smbConfig: SMBConfig;
  settings: BackupSettings;
  backend: {
    platform: string;
    canRunBackups: boolean;
  };
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('ru-RU');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Ошибка запроса (${response.status}).`);
  return body as T;
}

export const api = {
  getState: () => request<AppState>('/api/state'),
  addJob: (job: Omit<BackupJob, 'id' | 'lastRun' | 'lastStatus' | 'size' | 'filesCount'>) =>
    request<BackupJob>('/api/jobs', { method: 'POST', body: JSON.stringify(job) }),
  updateJob: (id: string, changes: Partial<Pick<BackupJob, 'enabled' | 'schedule'>>) =>
    request<BackupJob>(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteJob: (id: string) =>
    request<{ ok: boolean }>(`/api/jobs/${id}`, { method: 'DELETE' }),
  runJob: (id: string) =>
    request<{ accepted: boolean }>(`/api/jobs/${id}/run`, { method: 'POST' }),
  saveSmb: (config: SMBConfig) =>
    request<SMBConfig>('/api/smb', { method: 'PUT', body: JSON.stringify(config) }),
  testSmb: () => request<{ connected: boolean }>('/api/smb/test', { method: 'POST' }),
  saveSettings: (settings: BackupSettings) =>
    request<BackupSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
