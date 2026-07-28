import type { Metadata, Viewport } from 'next';

import './globals.css';
import { ThemeProvider } from 'next-themes';
import I18nProvider from '../components/I18nProvider';
import { SITE_URL } from '@/lib/seo';
import { UmamiAnalytics } from '@/components/UmamiAnalytics';
import { ThemeSync } from '@/components/ThemeSync';
import { withStaticBasePath } from '@/lib/static-base-path';

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Connect 4',
    template: '%s | Connect 4',
  },
  description: 'Play Connect 4 online with AI, local matches, and optional link-based online play.',
  ...(googleSiteVerification || bingSiteVerification
    ? {
        verification: {
          ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
          ...(bingSiteVerification ? { other: { 'msvalidate.01': bingSiteVerification } } : {}),
        },
      }
    : {}),
  icons: {
    icon: [
      { url: withStaticBasePath('/favicon.ico'), sizes: 'any' },
      { url: withStaticBasePath('/favicon.png'), type: 'image/png', sizes: '32x32' },
      { url: withStaticBasePath('/android-chrome-192x192.png'), type: 'image/png', sizes: '192x192' },
      { url: withStaticBasePath('/android-chrome-512x512.png'), type: 'image/png', sizes: '512x512' },
    ],
    apple: withStaticBasePath('/apple-touch-icon.png'),
  },
  manifest: withStaticBasePath('/manifest.webmanifest'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeSync />
          <I18nProvider>{children}</I18nProvider>
          <UmamiAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}