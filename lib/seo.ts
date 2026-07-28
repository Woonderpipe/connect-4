import type { Metadata } from 'next';
import { DEFAULT_LOCALE, getLocale, getLocalePath as getAppLocalePath, locales, type AppLocale } from '@/lib/locales';
import { getTranslation } from '@/lib/translations';

export type SiteLocale = AppLocale;

export type SeoLocaleContent = {
  heroTitle: string;
  heroDescription: string;
  highlights: string[];
};

const DEFAULT_SITE_URL = 'https://example.com';

export function resolveSiteUrl(siteUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  const value = siteUrl?.trim();
  if (!value) return DEFAULT_SITE_URL;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString().replace(/\/$/, '') : DEFAULT_SITE_URL;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function getSeoContent(locale: SiteLocale): SeoLocaleContent {
  const translation = getTranslation(locale);
  return {
    heroTitle: translation.title,
    heroDescription: translation.subtitle,
    highlights: [translation.pvp, translation.pve, translation.online],
  };
}

export function getLocaleSwitchOrder(): SiteLocale[] {
  return locales.map((locale) => locale.code);
}

export function getLocalePath(locale: SiteLocale): string {
  return getAppLocalePath(locale);
}

function absolutePath(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

export function buildPageMetadata(locale: SiteLocale): Metadata {
  const content = getSeoContent(locale);
  const definition = getLocale(locale);
  const path = getLocalePath(locale);
  const languages = Object.fromEntries(locales.map((item) => [item.tag, absolutePath(getLocalePath(item.code))]));
  languages['x-default'] = absolutePath(getLocalePath(DEFAULT_LOCALE));

  return {
    title: content.heroTitle,
    description: content.heroDescription,
    alternates: { canonical: path, languages },
    openGraph: {
      type: 'website',
      locale: definition.tag.replace('-', '_'),
      url: path,
      title: content.heroTitle,
      description: content.heroDescription,
      siteName: 'Connect 4',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Connect 4' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.heroTitle,
      description: content.heroDescription,
      images: ['/twitter-image'],
    },
  };
}

export function buildStructuredData(locale: SiteLocale): Record<string, unknown> {
  const content = getSeoContent(locale);
  const path = getLocalePath(locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Connect 4',
        inLanguage: getLocale(locale).tag,
      },
      {
        '@type': 'WebApplication',
        name: content.heroTitle,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        url: absolutePath(path),
        inLanguage: getLocale(locale).tag,
        description: content.heroDescription,
      },
    ],
  };
}