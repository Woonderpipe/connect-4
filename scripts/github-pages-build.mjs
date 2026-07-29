import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repository = process.env.GITHUB_REPOSITORY || '';
const [repositoryOwner, repositoryName] = repository.split('/');
const defaultBasePath = repositoryName ? `/${repositoryName}` : '';
const defaultSiteUrl = repositoryOwner && repositoryName
  ? `https://${repositoryOwner}.github.io${defaultBasePath}`
  : 'https://example.com';

function normalizeBasePath(value = defaultBasePath) {
  const basePath = value.trim();
  if (!basePath || basePath === '/') return '';
  if (!basePath.startsWith('/') || basePath.includes('?') || basePath.includes('#') || basePath.includes('//')) {
    throw new Error('NEXT_PUBLIC_BASE_PATH must be empty, "/", or a single URL path such as "/connect-four".');
  }
  return basePath.replace(/\/+$/, '');
}

function requireSecurePublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute HTTPS URL.');
  }
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname)) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use a public HTTPS origin for GitHub Pages.');
  }
  return url.toString().replace(/\/$/, '');
}

const siteUrl = requireSecurePublicUrl(process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl);
const sitePath = new URL(siteUrl).pathname.replace(/\/$/, '');

const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath = normalizeBasePath(
  configuredBasePath === undefined
    ? (sitePath || defaultBasePath)
    : configuredBasePath === ''
      ? sitePath
      : configuredBasePath,
);

if (sitePath !== basePath) {
  throw new Error(`NEXT_PUBLIC_SITE_URL path "${sitePath || '/'}" must match NEXT_PUBLIC_BASE_PATH "${basePath || '/'}".`);
}
if (process.env.NEXT_PUBLIC_SERVERLESS === 'false') {
  throw new Error('GitHub Pages supports the default PeerJS serverless mode only; set NEXT_PUBLIC_SERVERLESS=true.');
}

const nextCli = resolve(import.meta.dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
const result = spawnSync(process.execPath, [nextCli, 'build'], {
  env: {
    ...process.env,
    NEXT_PUBLIC_BUILD_TARGET: 'github-pages',
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_SERVERLESS: 'true',
    NEXT_PUBLIC_ONLINE_TEST_MODE: 'false',
    ONLINE_TEST_MODE: 'false',
  },
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) process.exit(result.status ?? 1);

const outDir = resolve(import.meta.dirname, '..', 'out');
mkdirSync(outDir, { recursive: true });

// Prevent GitHub Pages from running Jekyll on Next.js assets
writeFileSync(resolve(outDir, '.nojekyll'), '');

// 2. Extract domain name dynamically from siteUrl (e.g. "connect4.sharbel.de")
const domainName = new URL(siteUrl).hostname;

// Only write CNAME if using a custom domain (skips standard *.github.io domains)
if (!domainName.endsWith('.github.io')) {
  writeFileSync(resolve(outDir, 'CNAME'), domainName);
}