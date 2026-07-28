import type {NextConfig} from 'next';

const buildTarget = process.env.NEXT_PUBLIC_BUILD_TARGET;
const isMobileBuild = buildTarget === 'mobile';
const isGitHubPagesBuild = buildTarget === 'github-pages';
const isStaticBuild = isMobileBuild || isGitHubPagesBuild;
const isNetlifyBuild = process.env.NETLIFY === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const isOnlineTestMode = process.env.NEXT_PUBLIC_ONLINE_TEST_MODE === 'true' || process.env.ONLINE_TEST_MODE === 'true';
const enableTestOnlineRoutes = isOnlineTestMode && !isProduction;
const umamiEnabled = process.env.NEXT_PUBLIC_UMAMI_ENABLED === 'true';
const umamiHost = process.env.NEXT_PUBLIC_UMAMI_HOST?.replace(/\/$/, '');
const umamiOrigin = umamiEnabled && umamiHost ? new URL(umamiHost).origin : null;

function normalizeBasePath(value = ''): string {
  const basePath = value.trim();
  if (!basePath || basePath === '/') return '';
  if (!basePath.startsWith('/') || basePath.includes('?') || basePath.includes('#') || basePath.includes('//')) {
    throw new Error('NEXT_PUBLIC_BASE_PATH must be empty, "/", or a single URL path such as "/connect-four".');
  }
  return basePath.replace(/\/+$/, '');
}

const staticBasePath = isGitHubPagesBuild ? normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH) : '';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}${umamiOrigin ? ` ${umamiOrigin}` : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https: wss:${umamiOrigin ? ` ${umamiOrigin}` : ''}`,
  ...(isProduction ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ['motion'],
  ...(isStaticBuild
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        pageExtensions: ['tsx'],
        ...(staticBasePath ? { basePath: staticBasePath } : {}),
      }
    : {
        ...(isNetlifyBuild ? {} : { output: 'standalone' as const }),
        async headers() {
          return [{ source: '/(.*)', headers: securityHeaders }];
        },
        async rewrites() {
          if (!enableTestOnlineRoutes) return [];
          return [{ source: '/api/__test-online/:path*', destination: '/api/test-online/:path*' }];
        },
      }),
};

export default nextConfig;