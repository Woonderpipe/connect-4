import { getLocalePath, type AppLocale } from '@/lib/locales';

export type InviteLocale = AppLocale;

// A safe public fallback for source checkouts. Deployments must set
// NEXT_PUBLIC_SITE_URL to their own HTTPS origin before enabling sharing.
export const DEFAULT_INVITE_SITE_URL = 'https://example.com';
export const APP_INVITE_SCHEME = 'connect4';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

const normalizeGameCode = (gameCode: string) => gameCode.trim();

const isPublicHttpUrl = (url: URL) => {
  return (url.protocol === 'https:' || url.protocol === 'http:') && !LOCAL_HOSTNAMES.has(url.hostname);
};

export function getInviteSiteUrl(siteUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  const configuredUrl = siteUrl?.trim() || DEFAULT_INVITE_SITE_URL;

  try {
    const parsedUrl = new URL(configuredUrl);
    if (!isPublicHttpUrl(parsedUrl)) return DEFAULT_INVITE_SITE_URL;
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_INVITE_SITE_URL;
  }
}

export function buildWebInviteUrl(
  gameCode: string,
  options: { locale?: InviteLocale; siteUrl?: string } = {}
): string {
  const code = normalizeGameCode(gameCode);
  const localePath = getLocalePath(options.locale || 'en');
  const baseUrl = `${getInviteSiteUrl(options.siteUrl)}/`;
  const inviteUrl = new URL(localePath.replace(/^\//, ''), baseUrl);
  inviteUrl.searchParams.set('game', code);
  return inviteUrl.toString();
}

export function buildAppInviteUrl(gameCode: string): string {
  const inviteUrl = new URL(`${APP_INVITE_SCHEME}://join`);
  inviteUrl.searchParams.set('game', normalizeGameCode(gameCode));
  return inviteUrl.toString();
}

export function parseInviteGameCode(url: string): string | null {
  try {
    const parsedUrl = new URL(url, DEFAULT_INVITE_SITE_URL);
    const code = parsedUrl.searchParams.get('game')?.trim();
    return code || null;
  } catch {
    return null;
  }
}
