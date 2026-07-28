import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const allowedCommands = new Map([
  ['sync', new Set(['android'])],
  ['open', new Set(['android'])],
  ['run', new Set(['android'])],
]);

const [commandName, platformName, ...extraArgs] = args;
if (!commandName || !platformName || extraArgs.length > 0 || !allowedCommands.get(commandName)?.has(platformName)) {
  console.error('Usage: node scripts/capacitor.mjs <sync|open|run> android');
  process.exit(1);
}

const capacitorPackagePath = require.resolve('@capacitor/cli/package.json');
const capacitorPackage = JSON.parse(readFileSync(capacitorPackagePath, 'utf8'));
const capacitorBin = typeof capacitorPackage.bin === 'object'
  ? capacitorPackage.bin.cap || capacitorPackage.bin.capacitor
  : capacitorPackage.bin;

if (!capacitorBin) {
  console.error('Unable to resolve the Capacitor CLI binary.');
  process.exit(1);
}

const capacitorCliPath = resolve(dirname(capacitorPackagePath), capacitorBin);
const androidStudioJbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
const defaultAndroidSdk = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk')
  : undefined;
const javaHome = process.env.JAVA_HOME || (process.platform === 'win32' && existsSync(join(androidStudioJbr, 'bin', 'java.exe')) ? androidStudioJbr : undefined);
const androidSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (process.platform === 'win32' && existsSync(defaultAndroidSdk) ? defaultAndroidSdk : undefined);
const pathEntries = [
  javaHome ? join(javaHome, 'bin') : undefined,
  androidSdk ? join(androidSdk, 'platform-tools') : undefined,
  process.env.PATH,
].filter(Boolean);

const result = spawnSync(process.execPath, [capacitorCliPath, commandName, platformName], {
  env: {
    ...process.env,
    CI: '1',
    ...(javaHome ? { JAVA_HOME: javaHome } : {}),
    ...(androidSdk ? { ANDROID_HOME: androidSdk, ANDROID_SDK_ROOT: androidSdk } : {}),
    PATH: pathEntries.join(delimiter),
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
