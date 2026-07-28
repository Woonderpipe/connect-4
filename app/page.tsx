import { Connect4 } from '@/components/Connect4';
import { buildPageMetadata, buildStructuredData, serializeJsonLd } from '@/lib/seo';

export const metadata = buildPageMetadata('en');

export default function HomePage() {
  const structuredData = buildStructuredData('en');
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} /><Connect4 initialLanguage="en" /></>;
}