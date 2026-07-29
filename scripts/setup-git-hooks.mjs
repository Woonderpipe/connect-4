import { chmodSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const hookPath = path.join(root, '.githooks', 'pre-push');

if (!existsSync(path.join(root, '.git'))) {
  process.exit(0);
}

if (existsSync(hookPath) && process.platform !== 'win32') {
  chmodSync(hookPath, 0o755);
}

let existingHooksPath = '';
try {
  existingHooksPath = execFileSync('git', ['config', '--local', '--get', 'core.hooksPath'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  existingHooksPath = '';
}

if (!existingHooksPath) {
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
    cwd: root,
    stdio: 'ignore',
  });
  console.log('Configured local git hooks to use .githooks/pre-push.');
} else if (existingHooksPath !== '.githooks') {
  console.log(`Git core.hooksPath is already set to ${existingHooksPath}; .githooks was not overridden.`);
}