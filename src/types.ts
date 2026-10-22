export interface SMBConfig {
  server: string;
  share: string;
  username: string;
  password: string;
  domain: string;
  mountPoint: string;
  connected: boolean;
}

export interface BackupJob {
  id: string;
  name: string;
  sourcePath: string;
  enabled: boolean;
  lastRun: string | null;
  lastStatus: 'success' | 'error' | 'running' | 'never';
  schedule: ScheduleConfig;
  size: string;
  filesCount: number;
}

export interface ScheduleConfig {
  type: 'manual' | 'hourly' | 'daily' | 'weekly' | 'custom';
  time?: string;
  dayOfWeek?: number;
  cronExpression?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  jobName?: string;
}

export type Page = 'dashboard' | 'jobs' | 'smb' | 'schedule' | 'logs' | 'settings';
