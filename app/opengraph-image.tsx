import { ImageResponse } from 'next/og';
import { getSeoContent, type SiteLocale } from '@/lib/seo';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const dynamic = 'force-static';

const locale: SiteLocale = 'en';
const content = getSeoContent(locale);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #111827 0%, #0f172a 40%, #020617 100%)',
          color: '#f8fafc',
          padding: 56,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: '#ef4444',
            }}
          />
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: '#facc15',
            }}
          />
          <span style={{ fontSize: 30, fontWeight: 700 }}>Connect 4</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 66, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
            {content.heroTitle}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.3, color: '#cbd5e1', maxWidth: 1040 }}>
            {content.heroDescription}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {content.highlights.map((item) => (
            <div
              key={item}
              style={{
                fontSize: 23,
                padding: '8px 16px',
                borderRadius: 9999,
                border: '1px solid #334155',
                color: '#e2e8f0',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

