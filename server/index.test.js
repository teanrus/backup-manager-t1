import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

let baseUrl;
let dataDir;
let backend;
const currentDir = dirname(fileURLToPath(import.meta.url));
const testToken = 'test-api-token';

function apiRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Basic ${Buffer.from(`backup:${testToken}`).toString('base64')}`,
    },
  });
}

before(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'backup-manager-api-'));
  const tokenPath = path.join(dataDir, 'api-token');
  await writeFile(tokenPath, `${testToken}\n`, { mode: 0o600 });
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port.');
  await new Promise(resolve => probe.close(resolve));
  baseUrl = `http://127.0.0.1:${address.port}`;
  backend = spawn(process.execPath, [path.join(currentDir, 'index.js')], {
    env: {
      ...process.env,
      BACKUP_MANAGER_DATA_DIR: dataDir,
      BACKUP_MANAGER_PORT: String(address.port),
      BACKUP_MANAGER_API_TOKEN_FILE: tokenPath,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let startupError = '';
  backend.stderr.setEncoding('utf8');
  backend.stderr.on('data', chunk => { startupError += chunk; });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (backend.exitCode !== null) throw new Error(`Backend exited during startup: ${startupError}`);
    try {
      const response = await apiRequest(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Backend did not start: ${startupError}`);
});

after(async () => {
  if (backend && backend.exitCode === null) {
    backend.kill();
    await new Promise(resolve => backend.once('exit', resolve));
  }
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

test('API persists application data and protects SMB credentials', async () => {
  const configResponse = await apiRequest(`${baseUrl}/api/smb`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      server: 'files.example.local',
      share: 'backups',
      username: 'backup-user',
      password: 'test-secret',
      domain: 'WORKGROUP',
      mountPoint: path.join(dataDir, 'mount'),
    }),
  });
  assert.equal(configResponse.status, 200);
  const returnedConfig = await configResponse.json();
  assert.equal(returnedConfig.password, '');
  assert.equal(returnedConfig.passwordConfigured, true);

  const jobResponse = await apiRequest(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Documents',
      sourcePath: path.resolve(dataDir, 'documents'),
      enabled: true,
      schedule: { type: 'daily', time: '02:30' },
    }),
  });
  assert.equal(jobResponse.status, 201);
  const job = await jobResponse.json();

  const scheduleResponse = await apiRequest(`${baseUrl}/api/jobs/${job.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false, schedule: { type: 'weekly', time: '04:15', dayOfWeek: 2 } }),
  });
  assert.equal(scheduleResponse.status, 200);

  const invalidSchedule = await apiRequest(`${baseUrl}/api/jobs/${job.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule: { type: 'weekly', time: '25:99', dayOfWeek: 9 } }),
  });
  assert.equal(invalidSchedule.status, 400);

  const stateResponse = await apiRequest(`${baseUrl}/api/state`);
  const state = await stateResponse.json();
  assert.equal(state.jobs.length, 1);
  assert.equal(state.jobs[0].enabled, false);
  assert.equal(state.smbConfig.password, '');
  assert.equal(state.smbConfig.passwordConfigured, true);
  const persisted = await readFile(path.join(dataDir, 'state.json'), 'utf8');
  assert.equal(JSON.parse(persisted).smbConfig.password, 'test-secret');

  const crossOrigin = await apiRequest(`${baseUrl}/api/state`, { headers: { Origin: 'http://attacker.example' } });
  assert.equal(crossOrigin.status, 403);
});

test('API rejects mutations without a JSON content type', async () => {
  const response = await apiRequest(`${baseUrl}/api/jobs`, {
    method: 'POST',
    body: '{}',
  });
  assert.equal(response.status, 415);
});

test('API requires authentication when a token file is configured', async () => {
  const response = await fetch(`${baseUrl}/api/state`);
  assert.equal(response.status, 401);
});
