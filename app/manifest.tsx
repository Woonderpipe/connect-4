import type { MetadataRoute } from 'next';
import { withStaticBasePath } from '@/lib/static-base-path';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Connect 4',
    short_name: 'Connect 4',
    description: 'Play Connect 4 with AI, local matches, and online multiplayer.',
    start_url: withStaticBasePath('/'),
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: withStaticBasePath('/android-chrome-192x192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withStaticBasePath('/android-chrome-512x512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withStaticBasePath('/android-chrome-192x192.png'), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: withStaticBasePath('/android-chrome-512x512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}