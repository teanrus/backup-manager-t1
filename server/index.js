import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { chmod, mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dataDir = path.resolve(process.env.BACKUP_MANAGER_DATA_DIR || path.join(os.homedir(), '.backup-manager'));
const statePath = path.join(dataDir, 'state.json');
const apiTokenPath = process.env.BACKUP_MANAGER_API_TOKEN_FILE;
const maxRequestBytes = 1024 * 1024;
const runningJobs = new Set();
const scheduledRuns = new Map();
const pendingJobs = [];
let processingQueue = false;

const defaultState = () => ({
  jobs: [],
  logs: [],
  smbConfig: {
    server: '',
    share: '',
    username: '',
    password: '',
    domain: 'WORKGROUP',
    mountPoint: '/mnt/backup',
    connected: false,
  },
  settings: {
    compression: true,
    deleteExtra: false,
    verbose: false,
    bandwidthLimit: 0,
    retries: 3,
    notifyEmail: '',
    notifyOnError: true,
    notifyOnSuccess: false,
    logRetention: 30,
    parallelJobs: 1,
  },
});

await mkdir(dataDir, { recursive: true, mode: 0o700 });
await chmod(dataDir, 0o700);

async function loadState() {
  try {
    const contents = await readFile(statePath, 'utf8');
    const saved = JSON.parse(contents);
    const defaults = defaultState();
    return {
      ...defaults,
      ...saved,
      jobs: Array.isArray(saved.jobs) ? saved.jobs : [],
      logs: Array.isArray(saved.logs) ? saved.logs.slice(0, 1000) : [],
      smbConfig: { ...defaults.smbConfig, ...saved.smbConfig },
      settings: { ...defaults.settings, ...saved.settings },
    };
  } catch (error) {
    if (error.code === 'ENOENT') return defaultState();
    throw new Error(`Не удалось прочитать файл состояния ${statePath}: ${error.message}`);
  }
}

let state = await loadState();
const apiToken = apiTokenPath ? (await readFile(apiTokenPath, 'utf8')).trim() : '';
if (apiTokenPath && !apiToken) throw new Error(`API token file is empty: ${apiTokenPath}`);
const interruptedJobs = state.jobs.filter(job => job.lastStatus === 'running');
for (const job of interruptedJobs) {
  job.lastStatus = 'error';
}
try {
  await chmod(statePath, 0o600);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
let saveQueue = Promise.resolve();

function saveState() {
  const snapshot = `${JSON.stringify(state, null, 2)}\n`;
  const temporaryPath = `${statePath}.${randomUUID()}.tmp`;
  saveQueue = saveQueue.then(async () => {
    await writeFile(temporaryPath, snapshot, { mode: 0o600 });
    await rename(temporaryPath, statePath);
  });
  return saveQueue;
}

function publicState() {
  return {
    ...state,
    smbConfig: {
      ...state.smbConfig,
      password: '',
      passwordConfigured: Boolean(state.smbConfig.password),
    },
    backend: {
      platform: process.platform,
      canRunBackups: process.platform === 'linux',
    },
  };
}

async function addLog(level, message, jobName) {
  state.logs.unshift({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
    jobName,
  });
  const retentionStart = Date.now() - state.settings.logRetention * 24 * 60 * 60 * 1000;
  state.logs = state.logs.filter(log => {
    const timestamp = Date.parse(log.timestamp);
    return Number.isNaN(timestamp) || timestamp >= retentionStart;
  }).slice(0, 1000);
  await saveState();
}

for (const job of interruptedJobs) {
  await addLog('error', 'Backend перезапущен до завершения задания.', job.name);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function isAuthorized(request) {
  if (!apiTokenPath) return true;
  const expected = Buffer.from(`backup:${apiToken}`).toString('base64');
  const supplied = request.headers.authorization?.match(/^Basic ([A-Za-z0-9+/=]+)$/)?.[1];
  return supplied === expected;
}

async function readJson(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    const error = new Error('Для этого запроса требуется Content-Type: application/json.');
    error.status = 415;
    throw error;
  }
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxRequestBytes) {
      const error = new Error('Размер запроса превышает 1 МБ.');
      error.status = 413;
      throw error;
    }
  }
  let parsed;
  try {
    parsed = JSON.parse(body || '{}');
  } catch {
    const error = new Error('Некорректный JSON в запросе.');
    error.status = 400;
    throw error;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const error = new Error('Тело запроса должно быть JSON-объектом.');
    error.status = 400;
    throw error;
  }
  return parsed;
}

function requireString(value, field, maxLength = 500) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    const error = new Error(`Поле «${field}» обязательно и должно содержать не более ${maxLength} символов.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function validateSchedule(schedule) {
  const validTypes = ['manual', 'hourly', 'daily', 'weekly'];
  if (!schedule || !validTypes.includes(schedule.type)) {
    const error = new Error('Указан неподдерживаемый тип расписания.');
    error.status = 400;
    throw error;
  }
  if (schedule.type !== 'manual' && schedule.type !== 'hourly' &&
      (typeof schedule.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time))) {
    const error = new Error('Время расписания должно быть в формате ЧЧ:ММ.');
    error.status = 400;
    throw error;
  }
  if (schedule.type === 'weekly' && (!Number.isInteger(schedule.dayOfWeek) || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6)) {
    const error = new Error('Для еженедельного расписания укажите день недели от 0 до 6.');
    error.status = 400;
    throw error;
  }
  return structuredClone(schedule);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, LC_ALL: 'C' },
      ...options,
    });
    let output = '';
    const appendOutput = chunk => {
      output = `${output}${chunk.toString()}`.slice(-100_000);
    };
    child.stdout.on('data', appendOutput);
    child.stderr.on('data', appendOutput);
    child.once('error', reject);
    child.once('close', code => {
      if (code === 0) resolve(output);
      else reject(new Error(output.trim() || `${command} завершился с кодом ${code}.`));
    });
  });
}

async function withCredentials(callback) {
  const credentialsDir = path.join(dataDir, `credentials-${randomUUID()}`);
  await mkdir(credentialsDir, { mode: 0o700 });
  const credentialsPath = path.join(credentialsDir, 'smb-credentials');
  const { username, password, domain } = state.smbConfig;
  await writeFile(credentialsPath, `username=${username}\npassword=${password}\ndomain=${domain}\n`, { mode: 0o600 });
  try {
    return await callback(credentialsPath);
  } finally {
    await rm(credentialsDir, { recursive: true, force: true });
  }
}

function validateSmbConfig(input) {
  const server = requireString(input.server, 'сервер', 253);
  const share = requireString(input.share, 'общий ресурс', 255);
  const username = requireString(input.username, 'пользователь', 256);
  const password = typeof input.password === 'string' ? input.password : '';
  const domain = typeof input.domain === 'string' ? input.domain.trim() : 'WORKGROUP';
  const mountPoint = requireString(input.mountPoint, 'точка монтирования', 1024);
  if (/[\\/\s]/.test(server) || /[\\/\s]/.test(share) || /[\r\n]/.test(username + password + domain)) {
    const error = new Error('Проверьте сервер, имя ресурса и учётные данные.');
    error.status = 400;
    throw error;
  }
  if (!path.isAbsolute(mountPoint) || path.resolve(mountPoint) === path.parse(mountPoint).root) {
    const error = new Error('Точка монтирования должна быть абсолютным путём, отличным от корня файловой системы.');
    error.status = 400;
    throw error;
  }
  return { server, share, username, password, domain, mountPoint, connected: false };
}

function assertSeparatePaths(source, mountPoint) {
  const isWithin = (candidate, parent) => {
    const relative = path.relative(parent, candidate);
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
  };
  if (isWithin(source, mountPoint) || isWithin(mountPoint, source)) {
    const error = new Error('Источник и точка монтирования не должны находиться друг внутри друга.');
    error.status = 400;
    throw error;
  }
}

async function testSmbConnection() {
  if (process.platform !== 'linux') {
    const error = new Error('Проверка SMB и монтирование пока поддерживаются только в Linux.');
    error.status = 501;
    throw error;
  }
  return withCredentials(credentialsPath =>
    runCommand('smbclient', [`//${state.smbConfig.server}/${state.smbConfig.share}`, '-A', credentialsPath, '-c', 'ls'], { timeout: 15000 }),
  );
}

async function mountShare() {
  const { server, share, mountPoint } = state.smbConfig;
  await mkdir(mountPoint, { recursive: true });
  const existingMount = spawnSync('findmnt', ['-n', '-o', 'SOURCE', '--target', mountPoint], { encoding: 'utf8' });
  if (existingMount.status === 0 && existingMount.stdout.trim() === `//${server}/${share}`) return;
  if (existingMount.status === 0) {
    throw new Error(`Точка ${mountPoint} уже занята другим подключением (${existingMount.stdout.trim()}).`);
  }
  if (existingMount.error) throw new Error(`Не удалось проверить точку монтирования: ${existingMount.error.message}`);
  await withCredentials(credentialsPath =>
    runCommand('mount.cifs', [`//${server}/${share}`, mountPoint, '-o', `credentials=${credentialsPath},iocharset=utf8,file_mode=0700,dir_mode=0700,_netdev`]),
  );
}

async function runBackup(jobId) {
  const job = state.jobs.find(item => item.id === jobId);
  if (!job) {
    const error = new Error('Задание не найдено.');
    error.status = 404;
    throw error;
  }
  if (runningJobs.has(jobId)) {
    const error = new Error('Это задание уже выполняется.');
    error.status = 409;
    throw error;
  }
  if (process.platform !== 'linux') {
    const error = new Error('Запуск резервного копирования сейчас поддерживается только в Linux.');
    error.status = 501;
    throw error;
  }
  if (!state.smbConfig.server || !state.smbConfig.share || !state.smbConfig.username) {
    const error = new Error('Сначала настройте SMB-подключение.');
    error.status = 400;
    throw error;
  }

  const previousStatus = job.lastStatus;
  runningJobs.add(jobId);
  try {
    const sourcePath = path.resolve(job.sourcePath);
    const sourceStats = await stat(sourcePath);
    if (!sourceStats.isDirectory()) throw new Error(`Источник не является каталогом: ${sourcePath}`);
    assertSeparatePaths(sourcePath, path.resolve(state.smbConfig.mountPoint));
    job.lastStatus = 'running';
    await saveState();
    await addLog('info', 'Резервное копирование запущено.', job.name);
    pendingJobs.push(jobId);
  } catch (error) {
    runningJobs.delete(jobId);
    job.lastStatus = previousStatus;
    if (!error.status) error.status = 400;
    throw error;
  }
  void drainQueue();
}

async function executeBackup(jobId) {
  const job = state.jobs.find(item => item.id === jobId);
  if (!job) return;
  try {
    const sourcePath = await realpath(path.resolve(job.sourcePath));
    const sourceStats = await stat(sourcePath);
    if (!sourceStats.isDirectory()) throw new Error(`Источник не является каталогом: ${sourcePath}`);
    await mkdir(state.smbConfig.mountPoint, { recursive: true });
    const mountPoint = await realpath(state.smbConfig.mountPoint);
    assertSeparatePaths(sourcePath, mountPoint);

    await mountShare();
    const destination = path.join(mountPoint, job.id);
    await mkdir(destination, { recursive: true });
    const settings = state.settings;
    const args = ['-a', '--stats'];
    if (settings.compression) args.push('-z');
    if (settings.verbose) args.push('-v');
    if (settings.deleteExtra) args.push('--delete');
    if (settings.bandwidthLimit > 0) args.push(`--bwlimit=${settings.bandwidthLimit * 1000}`);
    args.push(`${sourcePath}${path.sep}`, `${destination}${path.sep}`);

    let result;
    for (let attempt = 1; attempt <= settings.retries; attempt += 1) {
      try {
        result = await runCommand('rsync', args);
        break;
      } catch (error) {
        if (attempt === settings.retries) throw error;
        await addLog('warning', `Попытка ${attempt} завершилась ошибкой: ${error.message}`, job.name);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const fileCount = result?.match(/Number of files:\s*([\d,]+)/)?.[1]?.replaceAll(',', '');
    const totalBytes = result?.match(/Total file size:\s*([\d,]+) bytes/)?.[1]?.replaceAll(',', '');
    if (fileCount) job.filesCount = Number(fileCount);
    if (totalBytes) {
      const bytes = Number(totalBytes);
      job.size = bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} ГБ` : `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
    }
    job.lastStatus = 'success';
    job.lastRun = new Date().toLocaleString('ru-RU', { hour12: false });
    await saveState();
    const stats = result?.match(/Number of files:.*|Total file size:.*|sent .* bytes.*received .*/g)?.join(' · ');
    await addLog('success', `Резервное копирование завершено.${stats ? ` ${stats}` : ''}`, job.name);
  } catch (error) {
    job.lastStatus = 'error';
    job.lastRun = new Date().toLocaleString('ru-RU', { hour12: false });
    await saveState();
    await addLog('error', `Ошибка резервного копирования: ${error.message}`, job.name);
  } finally {
    runningJobs.delete(jobId);
  }
}

async function drainQueue() {
  if (processingQueue) return;
  processingQueue = true;
  try {
    while (pendingJobs.length > 0) {
      try {
        await executeBackup(pendingJobs.shift());
      } catch (error) {
        console.error('Backup queue error:', error);
      }
    }
  } finally {
    processingQueue = false;
    if (pendingJobs.length > 0) void drainQueue();
  }
}

function scheduleIsDue(job, now) {
  if (!job.enabled || !job.schedule || job.schedule.type === 'manual') return false;
  if (job.schedule.type === 'hourly') return now.getMinutes() === 0;
  if (job.schedule.time !== `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`) return false;
  return job.schedule.type === 'daily' || (job.schedule.type === 'weekly' && job.schedule.dayOfWeek === now.getDay());
}

setInterval(() => {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  for (const job of state.jobs) {
    if (scheduleIsDue(job, now) && scheduledRuns.get(job.id) !== minuteKey) {
      scheduledRuns.set(job.id, minuteKey);
      void runBackup(job.id).catch(error => addLog('error', error.message, job.name));
    }
  }
}, 15000).unref();

async function handleRequest(request, response) {
  const host = request.headers.host?.replace(/:\d+$/, '');
  const remoteAddress = request.socket.remoteAddress;
  const origin = request.headers.origin;
  const allowedOrigins = new Set([
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  if (!['localhost', '127.0.0.1'].includes(host) ||
      (origin && !allowedOrigins.has(origin)) ||
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)) {
    return sendJson(response, 403, { error: 'Доступ разрешён только с этого компьютера.' });
  }
  if (!isAuthorized(request)) {
    response.setHeader('WWW-Authenticate', 'Basic realm="Backup Manager"');
    return sendJson(response, 401, { error: 'Требуется авторизация.' });
  }

  const url = new URL(request.url, 'http://localhost');
  try {
    if (request.method === 'GET' && url.pathname === '/api/health') return sendJson(response, 200, { ready: true });
    if (request.method === 'GET' && url.pathname === '/api/state') return sendJson(response, 200, publicState());

    if (request.method === 'POST' && url.pathname === '/api/jobs') {
      const body = await readJson(request);
      const job = {
        id: randomUUID(),
        name: requireString(body.name, 'название', 100),
        sourcePath: requireString(body.sourcePath, 'путь к каталогу', 1024),
        enabled: Boolean(body.enabled),
        schedule: validateSchedule(body.schedule),
        size: '—',
        filesCount: 0,
        lastRun: null,
        lastStatus: 'never',
      };
      if (!path.isAbsolute(job.sourcePath)) {
        const error = new Error('Путь к исходному каталогу должен быть абсолютным.');
        error.status = 400;
        throw error;
      }
      state.jobs.push(job);
      await saveState();
      await addLog('info', `Добавлено задание «${job.name}».`);
      return sendJson(response, 201, job);
    }

    const jobRoute = url.pathname.match(/^\/api\/jobs\/([0-9a-f-]+)$/i);
    if (jobRoute) {
      const job = state.jobs.find(item => item.id === jobRoute[1]);
      if (!job) return sendJson(response, 404, { error: 'Задание не найдено.' });
      if (request.method === 'PATCH') {
        const body = await readJson(request);
        if ('enabled' in body) job.enabled = Boolean(body.enabled);
        if ('schedule' in body) job.schedule = validateSchedule(body.schedule);
        await saveState();
        await addLog('info', `Обновлено задание «${job.name}».`);
        return sendJson(response, 200, job);
      }
      if (request.method === 'DELETE') {
        if (runningJobs.has(job.id)) return sendJson(response, 409, { error: 'Нельзя удалить задание во время выполнения.' });
        state.jobs = state.jobs.filter(item => item.id !== job.id);
        await saveState();
        await addLog('info', `Удалено задание «${job.name}».`);
        return sendJson(response, 200, { ok: true });
      }
    }

    const runRoute = url.pathname.match(/^\/api\/jobs\/([0-9a-f-]+)\/run$/i);
    if (request.method === 'POST' && runRoute) {
      await runBackup(runRoute[1]);
      return sendJson(response, 202, { accepted: true });
    }

    if (request.method === 'PUT' && url.pathname === '/api/smb') {
      const body = await readJson(request);
      const config = validateSmbConfig(body);
      if (!config.password) config.password = state.smbConfig.password;
      state.smbConfig = config;
      await saveState();
      await addLog('info', 'Сохранены настройки SMB-подключения.');
      return sendJson(response, 200, publicState().smbConfig);
    }

    if (request.method === 'POST' && url.pathname === '/api/smb/test') {
      await testSmbConnection();
      state.smbConfig.connected = true;
      await saveState();
      await addLog('success', 'SMB-подключение проверено.');
      return sendJson(response, 200, { connected: true });
    }

    if (request.method === 'PUT' && url.pathname === '/api/settings') {
      const body = await readJson(request);
      const settings = {
        compression: Boolean(body.compression),
        deleteExtra: Boolean(body.deleteExtra),
        verbose: Boolean(body.verbose),
        bandwidthLimit: Number(body.bandwidthLimit),
        retries: Number(body.retries),
        notifyEmail: typeof body.notifyEmail === 'string' ? body.notifyEmail.trim() : '',
        notifyOnError: Boolean(body.notifyOnError),
        notifyOnSuccess: Boolean(body.notifyOnSuccess),
        logRetention: Number(body.logRetention),
        parallelJobs: Number(body.parallelJobs),
      };
      if (      !Number.isSafeInteger(settings.bandwidthLimit) || settings.bandwidthLimit < 0 || settings.bandwidthLimit > 1000000 ||
          !Number.isInteger(settings.retries) || settings.retries < 1 || settings.retries > 10 ||
      !Number.isInteger(settings.logRetention) || settings.logRetention < 1 || settings.logRetention > 3650 ||
          !Number.isInteger(settings.parallelJobs) || settings.parallelJobs !== 1) {
        const error = new Error('Проверьте ограничения скорости, количество попыток и срок хранения журналов.');
        error.status = 400;
        throw error;
      }
      state.settings = settings;
      await saveState();
      await addLog('info', 'Сохранены общие настройки.');
      return sendJson(response, 200, state.settings);
    }

    return sendJson(response, 404, { error: 'API-метод не найден.' });
  } catch (error) {
    const status = error.status || (error.code === 'ENOENT' ? 503 : 500);
    if (status >= 500) console.error(error);
    return sendJson(response, status, { error: error.message || 'Внутренняя ошибка backend.' });
  }
}

const port = Number(process.env.BACKUP_MANAGER_PORT || 3001);
const host = process.env.BACKUP_MANAGER_HOST || '127.0.0.1';
const server = createServer((request, response) => void handleRequest(request, response));
server.listen(port, host, () => console.log(`Backup Manager API listens on http://${host}:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
