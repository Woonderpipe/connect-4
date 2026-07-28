import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const parsePort = (value = process.env.PLAYWRIGHT_PORT || '4464') => {
  if (!/^\d+$/.test(value)) throw new Error('PLAYWRIGHT_PORT must be a numeric TCP port.');
  const parsedPort = Number(value);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('PLAYWRIGHT_PORT must be between 1 and 65535.');
  }
  return String(parsedPort);
};

const port = parsePort();
const nextCli = resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextCli, 'dev', '-p', port], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_ONLINE_TEST_MODE: 'true',
    NEXT_PUBLIC_SERVERLESS: 'true',
    ONLINE_TEST_MODE: 'true',
  },
});

const stopChild = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => stopChild('SIGINT'));
process.on('SIGTERM', () => stopChild('SIGTERM'));
child.on('exit', (code) => process.exit(code ?? 0));