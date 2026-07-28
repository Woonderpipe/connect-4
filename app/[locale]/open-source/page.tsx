import { notFound, redirect } from 'next/navigation';
import { OpenSourceLicensesPage } from '@/components/OpenSourceLicensesPage';
import { DEFAULT_LOCALE, isAppLocale, localeCodes } from '@/lib/locales';

type PageProps = { params: Promise<{ locale: string }> };

export function generateStaticParams() { return localeCodes.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ locale })); }
export default async function LocalizedOpenSourcePage({ params }: PageProps) { const { locale } = await params; if (!isAppLocale(locale)) notFound(); if (locale !== 'de') redirect('/open-source'); return <OpenSourceLicensesPage locale="de" />; }