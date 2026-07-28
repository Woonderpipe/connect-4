# Contributing

Thanks for helping improve Connect 4. The project is a Next.js web game with a
Capacitor Android wrapper. Read the root `README.md`, root `AGENTS.md`, and `docs/architecture/design.md` first.

## Before you start

- Keep changes focused and preserve unrelated work.
- Never include secrets, signing files, personal data, debug logs, or generated
  build output.
- Check new dependencies, services, permissions, assets, and licenses before
  adding them.

## Development

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Before submitting, run the relevant lint, typecheck, build, and Playwright
commands. Android changes also require the unsigned release checks documented
in `docs/android/README.md` and `docs/android/play-store/README.md`.

## Pull requests

Describe the behavior changed, affected platforms, privacy/data implications,
and verification performed. Include screenshots for visible UI changes. Call
out external services, permissions, dependencies, assets, or license impacts.

The project is licensed under Apache-2.0. Contributions are submitted under
the same terms unless a separate written agreement says otherwise. Contributors
must retain provenance for code and assets they submit.

