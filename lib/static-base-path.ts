const buildTarget = process.env.NEXT_PUBLIC_BUILD_TARGET;

function normalizeBasePath(value = ''): string {
  const basePath = value.trim();
  if (!basePath || basePath === '/') return '';
  if (!basePath.startsWith('/') || basePath.includes('?') || basePath.includes('#') || basePath.includes('//')) {
    return '';
  }
  return basePath.replace(/\/+$/, '');
}

export const staticBasePath = buildTarget === 'github-pages'
  ? normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)
  : '';

export function withStaticBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${staticBasePath}${path}`;
}