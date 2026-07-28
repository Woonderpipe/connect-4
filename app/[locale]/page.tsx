import { notFound, redirect } from 'next/navigation';
import { Connect4 } from '@/components/Connect4';
import { buildPageMetadata, buildStructuredData, serializeJsonLd } from '@/lib/seo';
import { DEFAULT_LOCALE, isAppLocale, localeCodes } from '@/lib/locales';

type PageProps = { params: Promise<{ locale: string }> };

export function generateStaticParams() { return localeCodes.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ locale })); }
export async function generateMetadata({ params }: PageProps) { const { locale } = await params; return isAppLocale(locale) ? buildPageMetadata(locale) : {}; }
export default async function LocalizedGamePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  if (locale === DEFAULT_LOCALE) redirect('/');
  const structuredData = buildStructuredData(locale);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} /><Connect4 initialLanguage={locale} /></>;
}