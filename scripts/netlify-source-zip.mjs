import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { ZipArchive } from 'archiver';

const root = process.cwd();
const artifactDir = path.join(root, 'dist', 'netlify');
const artifactPath = path.join(artifactDir, 'connect-4-netlify-source.zip');

const requiredPaths = [
  'package.json',
  'pnpm-lock.yaml',
  'next.config.ts',
  'netlify.toml',
  'app',
  'components',
  'hooks',
  'lib',
  'locales',
  'public',
];

const excludedRootEntries = new Set([
  '.git',
  '.next',
  '.netlify',
  '.turbo',
  '.vercel',
  'android',
  'build',
  'coverage',
  'deploy',
  'dist',
  'node_modules',
  'out',
  'playwright-report',
  'test-results',
  '.dockerignore',
]);

const excludedExtensions = new Set([
  '.log',
  '.tmp',
  '.temp',
  '.tsbuildinfo',
]);

const shouldExclude = (relativePath) => {
  const normalized = relativePath.split(path.sep).join('/');
  const rootEntry = normalized.split('/')[0];
  const baseName = path.basename(normalized);

  if (excludedRootEntries.has(rootEntry)) return true;
  if (baseName === '.DS_Store' || baseName === 'Thumbs.db') return true;
  if (baseName.startsWith('_tmp_')) return true;
  if (baseName === '.env' || baseName.startsWith('.env.')) return true;
  if (excludedExtensions.has(path.extname(baseName))) return true;
  return false;
};

const assertRequiredPaths = async () => {
  const missing = [];

  for (const requiredPath of requiredPaths) {
    try {
      await stat(path.join(root, requiredPath));
    } catch {
      missing.push(requiredPath);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Cannot create Netlify ZIP. Missing required paths: ${missing.join(', ')}`);
  }
};

const addDirectory = async (archive, absoluteDir, relativeDir = '') => {
  const entries = await readdir(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;

    if (shouldExclude(relativePath)) continue;

    if (entry.isDirectory()) {
      await addDirectory(archive, absolutePath, relativePath);
      continue;
    }

    if (entry.isFile()) {
      archive.file(absolutePath, { name: relativePath.split(path.sep).join('/') });
    }
  }
};

await assertRequiredPaths();
await rm(artifactDir, { recursive: true, force: true });
await mkdir(artifactDir, { recursive: true });

const output = createWriteStream(artifactPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

const completed = new Promise((resolve, reject) => {
  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);
});

archive.pipe(output);
await addDirectory(archive, root);
await archive.finalize();
await completed;

console.log(`Created ${path.relative(root, artifactPath)} (${archive.pointer()} bytes)`);
