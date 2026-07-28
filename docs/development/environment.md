# Development environment

## Requirements

- Node.js `24.18.0` (the current LTS line used by this repository). The `.node-version` file is the source of truth.
- Corepack with pnpm `11.15.1`.
- Java 17+ for Android builds.
- Android SDK/API levels documented in `docs/android/README.md`.
- Android Studio for native device/emulator work.

## Environment files

Copy `.env.example` to the ignored root `.env` for local development. It only
sets the local site URL and serverless multiplayer mode. Never commit `.env`,
signing properties, service-account files, or private endpoints.

Docker production configuration lives in the ignored
`deploy/docker/.env.production`; start from its tracked template. Test-only
routes are controlled by the tooling and remain disabled in production.