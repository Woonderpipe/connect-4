import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const isWindows = process.platform === 'win32';
const pnpmCommand = 'pnpm';
const trackedGeneratedFiles = [
  'android/app/capacitor.build.gradle',
  'android/capacitor.settings.gradle',
  'docs/legal/license-review-report.md',
  'docs/third_party/THIRD_PARTY_NOTICES.md',
  'lib/generated/open-source-licenses.ts',
];

function run(command, args, description) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: isWindows,
  });

  if (result.status !== 0) {
    process.stderr.write(`\nPre-push check failed while running ${description}. Push canceled.\n`);
    process.exit(result.status ?? 1);
  }
}

function getChangedFiles() {
  const output = execFileSync('git', ['diff', '--name-only', '--', ...trackedGeneratedFiles], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

run(pnpmCommand, ['prepublish:check'], 'pnpm prepublish:check');
run(pnpmCommand, ['pages:build'], 'pnpm pages:build');
run(pnpmCommand, ['notices:check'], 'pnpm notices:check');
run(pnpmCommand, ['mobile:build'], 'pnpm mobile:build');
run('node', ['scripts/capacitor.mjs', 'sync', 'android'], 'Capacitor sync');
run(pnpmCommand, ['licenses:generate'], 'pnpm licenses:generate');
run(pnpmCommand, ['licenses:check'], 'pnpm licenses:check');

const changedFiles = getChangedFiles();
if (changedFiles.length > 0) {
  process.stderr.write('\nGenerated release artifacts changed during the pre-push check:\n');
  for (const file of changedFiles) {
    process.stderr.write(`- ${file}\n`);
  }
  process.stderr.write('Commit those changes, then push again. Push canceled.\n');
  process.exit(1);
}