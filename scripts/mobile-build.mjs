import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const defaultSiteUrl = 'https://example.com';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl;
const serverless = process.env.NEXT_PUBLIC_SERVERLESS || 'true';

function requireSecurePublicUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
  const isExampleHost = url.hostname === 'example.com' || url.hostname.endsWith('.example.com');
  if (url.protocol !== 'https:' || localHosts.has(url.hostname) || (process.env.REQUIRE_NON_EXAMPLE_SITE_URL === 'true' && isExampleHost)) {
    throw new Error(`${name} must use a public HTTPS origin for an Android release build.`);
  }

  return url.origin;
}

const publicSiteUrl = requireSecurePublicUrl('NEXT_PUBLIC_SITE_URL', siteUrl);
if (serverless === 'false') {
  requireSecurePublicUrl('NEXT_PUBLIC_POCKETBASE_URL', process.env.NEXT_PUBLIC_POCKETBASE_URL || '');
}

const env = {
  ...process.env,
  NEXT_PUBLIC_BUILD_TARGET: 'mobile',
  NEXT_PUBLIC_SERVERLESS: serverless,
  NEXT_PUBLIC_SITE_URL: publicSiteUrl,
  NEXT_PUBLIC_BASE_PATH: '',
};

const nextCli = resolve(import.meta.dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
const result = spawnSync(process.execPath, [nextCli, 'build'], {
  env,
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 1);
