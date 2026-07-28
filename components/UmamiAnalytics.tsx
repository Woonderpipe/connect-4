import Script from 'next/script';

import { analyticsEnabled, umamiHost, umamiWebsiteId, trackAnalyticsEvent } from '@/lib/analytics';

export function UmamiAnalytics() {
  if (!analyticsEnabled) return null;

  return (
    <Script
      src={`${umamiHost}/script.js`}
      data-website-id={umamiWebsiteId}
      data-host-url={umamiHost}
      data-exclude-search="true"
      data-exclude-hash="true"
      data-do-not-track="true"
      onLoad={() => trackAnalyticsEvent({ name: 'app_open' })}
      strategy="afterInteractive"
    />
  );
}