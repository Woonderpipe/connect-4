import type { MetadataRoute } from 'next';
import { getLocalePath, SITE_URL } from '@/lib/seo';
import { DEFAULT_LOCALE, locales } from '@/lib/locales';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const languageAlternates = Object.fromEntries(locales.map((locale) => [locale.tag, `${SITE_URL}${getLocalePath(locale.code) === '/' ? '' : getLocalePath(locale.code)}`]));
  languageAlternates['x-default'] = SITE_URL;
  const now = new Date();
  return [
    ...locales.map((locale) => ({ url: `${SITE_URL}${getLocalePath(locale.code) === '/' ? '' : getLocalePath(locale.code)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: locale.code === DEFAULT_LOCALE ? 1 : 0.8, alternates: { languages: languageAlternates } })),
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/de/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/open-source`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/de/open-source`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
  ];
}