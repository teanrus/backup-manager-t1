import { SMBConfig, BackupJob, LogEntry } from './types';

export const initialSMBConfig: SMBConfig = {
  server: '',
  share: '',
  username: '',
  password: '',
  domain: 'WORKGROUP',
  mountPoint: '/mnt/backup',
  connected: false,
};

export const initialJobs: BackupJob[] = [];

export const initialLogs: LogEntry[] = [];
