# Local development

## Requirements

- Node.js 24.18.0 or newer
- Corepack-enabled pnpm 11.15.1
- Java 17 and Android SDK only for Android builds

## Start the web app

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open `http://localhost:4444`. The dev server reads `.env` when present; start from `.env.example` and keep all local secrets untracked.

## Build the Android web assets

```bash
corepack pnpm mobile:build
node scripts/capacitor.mjs sync android
```

Open the `android/` project in Android Studio or run the documented device command from [the Android guide](../android/README.md).

## Stop and clean

Stop the foreground dev process with `Ctrl+C`. Remove generated outputs with:

```bash
corepack pnpm clean
```

Do not delete `.env`, keystores, or other local credentials during cleanup.