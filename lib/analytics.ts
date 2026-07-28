export type AnalyticsPlatform = 'web' | 'android';
export type GameMode = 'pvp' | 'pve' | 'online';
export type TimerMode = 'unlimited' | 'timed';

export type AnalyticsEvent =
  | { name: 'app_open' }
  | { name: 'game_start'; data: { mode: GameMode; timer: TimerMode; variant: string } }
  | { name: 'mode_selected'; data: { mode: GameMode } }
  | { name: 'online_match_created' }
  | { name: 'online_match_joined' }
  | { name: 'game_end'; data: { mode: GameMode; outcome: 'red' | 'yellow' | 'draw'; variant: string } }
  | { name: 'share_invite_clicked' };

declare global {
  interface Window {
    umami?: {
      track: (name?: string, data?: Record<string, string>) => void;
    };
  }
}

const platform: AnalyticsPlatform = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile' ? 'android' : 'web';

export const umamiHost = process.env.NEXT_PUBLIC_UMAMI_HOST?.replace(/\/$/, '') || '';
export const umamiWebsiteId = platform === 'android'
  ? process.env.NEXT_PUBLIC_UMAMI_ANDROID_WEBSITE_ID || ''
  : process.env.NEXT_PUBLIC_UMAMI_WEB_WEBSITE_ID || '';

export const analyticsPlatform = platform;
const umamiEnabled = process.env.NEXT_PUBLIC_UMAMI_ENABLED === 'true';

export const analyticsEnabled = Boolean(umamiEnabled && umamiHost && umamiWebsiteId);

export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined' || !window.umami || !analyticsEnabled) return;

  if ('data' in event) {
    window.umami.track(event.name, { ...event.data, platform });
    return;
  }

  window.umami.track(event.name, { platform });
}