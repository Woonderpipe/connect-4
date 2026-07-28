import type { Metadata } from 'next';
import { OpenSourceLicensesPage } from '@/components/OpenSourceLicensesPage';

export const metadata: Metadata = { title: 'Open Source Licenses', description: 'Open-source licenses and attribution for Connect 4.' };
export default function OpenSourcePage() { return <OpenSourceLicensesPage locale="en" />; }