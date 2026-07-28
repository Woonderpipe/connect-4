# Architecture

## Runtime layers

- `app/`: Next.js routes, metadata, privacy/legal pages, APIs, sitemap, and robots.
- `components/Connect4/`: board, controls, status, pieces, history, modals, and SEO content.
- `hooks/use-connect4.ts`: state, persistence, timers, AI scheduling, online lifecycle, sharing, and Android deep links.
- `lib/connect4-logic.ts`: pure board rules, variants, win detection, scoring, minimax, and AI selection.
- `lib/invite-links.ts`: public invite and deep-link URL handling.
- `lib/pocketbase.ts`: optional PocketBase transport.
- `lib/locales.ts` and `lib/translations.ts`: shared 16-language locale definitions and game UI copy.
- `android/`: Capacitor native Android project.
- `scripts/`: build, release, test-server, asset, and source-archive tooling.
- `docs/android/play-store/`: Play Console evidence, listing copy, assets, and release operations.

## Build targets

The normal build is a web/server build. Setting `NEXT_PUBLIC_BUILD_TARGET=mobile`
enables the static export used by Capacitor. The Android application is a
native shell around that export; it does not replace the browser deployment.

## Online transports

PeerJS/WebRTC is the default serverless path. PocketBase is optional and needs a
separate privacy, retention, security, and Data Safety review before it is
enabled for an official release.

