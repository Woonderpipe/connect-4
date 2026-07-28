import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const androidDir = join(root, 'android');
const signingFile = join(androidDir, 'keystore.properties');
const bundlePath = join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const args = new Set(process.argv.slice(2));
const unsigned = args.delete('--unsigned');
args.delete('--');
const apkPath = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', unsigned ? 'app-release-unsigned.apk' : 'app-release.apk');

const readOption = (prefix, fallback) => {
  const option = [...args].find((value) => value.startsWith(prefix));
  if (!option) return fallback;
  args.delete(option);
  return option.slice(prefix.length);
};

const versionCode = readOption('--version-code=', process.env.ANDROID_VERSION_CODE || '1');
const versionName = readOption('--version-name=', process.env.ANDROID_VERSION_NAME || packageJson.version);

if (args.size > 0 || !/^\d+$/.test(versionCode) || Number(versionCode) < 1 || !versionName) {
  console.error('Usage: node scripts/android-release.mjs [--unsigned] [--version-code=N] [--version-name=X.Y.Z]');
  process.exit(1);
}

if (!unsigned && !existsSync(signingFile)) {
  console.error('Missing android/keystore.properties. Configure the upload key first, or use android:bundle:check for an unsigned verification build.');
  process.exit(1);
}

const androidStudioJbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
const defaultAndroidSdk = join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk');
const javaHome = process.env.JAVA_HOME || (existsSync(join(androidStudioJbr, 'bin', 'java.exe')) ? androidStudioJbr : undefined);
const androidSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (existsSync(defaultAndroidSdk) ? defaultAndroidSdk : undefined);
const commandEnv = {
  ...process.env,
  CI: '1',
  ANDROID_VERSION_CODE: versionCode,
  ANDROID_VERSION_NAME: versionName,
  ...(javaHome ? { JAVA_HOME: javaHome } : {}),
  ...(androidSdk ? { ANDROID_HOME: androidSdk, ANDROID_SDK_ROOT: androidSdk } : {}),
  PATH: [javaHome ? join(javaHome, 'bin') : undefined, androidSdk ? join(androidSdk, 'platform-tools') : undefined, process.env.PATH]
    .filter(Boolean)
    .join(delimiter),
};

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: commandEnv,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command !== process.execPath,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['scripts/mobile-build.mjs'], root);
run(process.execPath, ['scripts/capacitor.mjs', 'sync', 'android'], root);
const gradleArgs = [
  ':app:lintRelease',
  ':app:assembleRelease',
  ':app:bundleRelease',
  `-PVERSION_CODE=${versionCode}`,
  `-PVERSION_NAME=${versionName}`,
  '--no-daemon',
];
run(
  process.platform === 'win32' ? 'gradlew.bat' : 'bash',
  process.platform === 'win32' ? gradleArgs : ['./gradlew', ...gradleArgs],
  androidDir,
);

for (const artifact of [apkPath, bundlePath]) {
  if (!existsSync(artifact)) {
    console.error(`Expected Android release artifact was not created: ${artifact}`);
    process.exit(1);
  }
}

const releaseKind = unsigned ? 'unsigned verification' : 'signed release';
for (const artifact of [apkPath, bundlePath]) {
  const sizeMiB = (statSync(artifact).size / 1024 / 1024).toFixed(2);
  console.log(`Android artifact ready (${releaseKind}): ${artifact} (${sizeMiB} MiB)`);
}