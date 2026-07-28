# Testing

## Web checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e:online
corepack pnpm test:e2e:mobile
```

## Android checks

```powershell
corepack pnpm mobile:build
corepack pnpm android:bundle:check -- --version-code=1 --version-name=1.0.0
```

The browser and Android checks cover the supported local, online, navigation, and export paths. Device-specific behavior should also be tested on representative Android versions when changes affect native integration, deep links, permissions, or WebView behavior.

Changes to dependencies, storage, sharing, online transports, permissions, or deployment configuration should be reflected in the relevant legal and privacy documentation.