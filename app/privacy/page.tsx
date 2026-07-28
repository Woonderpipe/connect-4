import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'Privacy information for Connect 4.' };
export default function PrivacyPage() { return <PrivacyPolicy locale="en" />; }