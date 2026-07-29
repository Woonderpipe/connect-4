# Connect 4

<p align="center">
  <strong>A polished Connect 4 game for browser and Android.</strong><br />
  Play locally, challenge the AI, or invite a friend online — with the same game available as an Android app.
</p>

<p align="center">
  <a href="https://github.com/Woonderpipe/connect-4-public/releases/latest/download/connect4.apk"><img alt="Download latest Android APK" src="https://img.shields.io/badge/Download-latest%20Android%20APK-3DDC84?logo=android&logoColor=white" /></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" />
  <img alt="Package manager" src="https://img.shields.io/badge/pnpm-11.15.1-f69220?logo=pnpm&logoColor=white" />
</p>

> [!TIP]
> **Want to play on Android?** [Download the latest APK](https://github.com/Woonderpipe/connect-4-public/releases/latest/download/connect4.apk). Verify it with the accompanying `SHA256SUMS.txt` on the [latest release](https://github.com/Woonderpipe/connect-4-public/releases/latest).

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:4444](http://localhost:4444).

`pnpm install` also configures a local pre-push hook that runs the release checks and aborts the push if generated artifacts are stale or a step fails.

<details>
<summary><strong>Production build and quality checks</strong></summary>

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Run `pnpm prepublish:check` before a larger publication or deployment. The online multiplayer browser check is available as `pnpm test:e2e:online`.
</details>

## At a Glance

| Area | Details |
| --- | --- |
| Game modes | Local PvP, player-vs-AI, and online multiplayer |
| AI | `easy`, `medium`, and `hard` minimax-based play |
| Online | PeerJS serverless by default; optional PocketBase transport |
| Mobile | Android Capacitor wrapper around a static Next.js export |
| Languages | 16 languages, including Arabic RTL support |
| Persistence | LocalStorage for stats, preferences, and the current game |

## Features

| Play | Customize | Share |
| --- | --- | --- |
| Local PvP and AI opponents | Color themes, System/Light/Dark appearance, tabletop mode | Online codes, invite links, and result sharing |
| Pop-Out, Gravity, Bomb Disc, Wild Spots, Power-Up, Rising Floor, and Connect 5 | Timers, undo, move history | Browser and Android cross-play |

## Android App

The Android app wraps the static mobile export; desktop remains browser-first.

```bash
pnpm mobile:build
pnpm android:sync
pnpm android:open
pnpm android:run
```

| Command | Purpose |
| --- | --- |
| `pnpm mobile:build` | Build the mobile web bundle into `out/`. |
| `pnpm android:sync` | Copy the bundle and sync Capacitor plugins. |
| `pnpm android:run` | Build and deploy to a connected device/emulator. |
| `pnpm android:bundle` | Build a signed Play Store AAB after local signing setup. |
| `pnpm android:bundle:check` | Build and lint an unsigned release AAB for local/CI verification. |

> Full setup, deep-link testing, signing, and troubleshooting: [Android guide](docs/android/README.md).

### Cross-Play

```text
https://example.com/?game=<code>
connect4://join?game=<code>
```

Android shares the public web invite URL, so standard Android share targets can pass a player straight into a match. Verified HTTPS App Links additionally need `/.well-known/assetlinks.json` for the final signing certificate.

## Online Multiplayer

| Transport | Enabled when | Notes |
| --- | --- | --- |
| PeerJS serverless | `NEXT_PUBLIC_SERVERLESS !== 'false'` | Default; no database; suitable for browser-to-Android cross-play. |
| PocketBase | `NEXT_PUBLIC_SERVERLESS === 'false'` | Uses `NEXT_PUBLIC_POCKETBASE_URL`; intended as an optional backend path. |

The important public build settings are `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SERVERLESS`. See [environment configuration](docs/development/environment.md) for the local/production split.

## Project Map

```text
app/                    Next.js routes, metadata, sitemap, robots, API test routes
components/Connect4/    Board, controls, status, modals, history, pieces, SEO section
hooks/use-connect4.ts   Game state, persistence, AI scheduling, and online lifecycle
lib/connect4-logic.ts   Pure board rules, scoring, win detection, and minimax AI
lib/invite-links.ts     Public invite URL and deep-link helpers
locales/                16-language UI translation registry
android/                Capacitor Android native project
```

## Documentation

| Topic | Start here |
| --- | --- |
| Development, testing, and architecture | [Documentation index](docs/README.md) |
| GitHub Pages (recommended), Docker, VPS, and Netlify | [Deployment guide](docs/deployment/README.md) |
| Android development and Play distribution | [Android guide](docs/android/README.md) |
| Privacy, services, assets, and attribution | [Legal documentation](docs/legal/README.md) |
| Dependency notices | [Open-source licenses](open-source) · [third-party notices](docs/third_party/THIRD_PARTY_NOTICES.md) |

## License

Licensed under [Apache License 2.0](LICENSE). The code license does not grant rights to project names, logos, package identifiers, domains, or store branding; see [trademarks](docs/legal/trademarks.md).