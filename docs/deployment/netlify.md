# Netlify Source ZIP Deployment

Use this when you want Netlify to build the app from an uploaded ZIP without connecting a GitHub account.

## Create the ZIP

```bash
pnpm netlify:zip
```

The command writes:

```text
dist/netlify/connect-4-netlify-source.zip
```

This is a source/build ZIP. It is not the same as dragging a prebuilt static `out/` folder into Netlify Drop. The ZIP includes the project source and `netlify.toml`, then Netlify installs dependencies and runs `corepack pnpm build` with its Next.js adapter.

## What Is Included

The ZIP includes the files Netlify needs to build the Next.js app, including:

- `netlify.toml`
- `package.json`
- `pnpm-lock.yaml`
- Next/TypeScript/PostCSS config files
- `app/`, `components/`, `hooks/`, `lib/`, `locales/`, and `public/`

The ZIP excludes local or unrelated deployment files such as:

- `.env*`
- `.git/`
- `node_modules/`
- `.next/`, `out/`, and `dist/`
- Docker/VPS files under `deploy/`
- Android build files
- Playwright reports and test output

## Netlify Settings

`netlify.toml` sets the build command and core environment defaults:

```toml
[build]
command = "corepack pnpm build"
publish = ".next"
```

Netlify should auto-detect the Next.js app and use its maintained Next.js/OpenNext adapter. Do not install or pin `@netlify/plugin-nextjs` unless Netlify support specifically tells you to.

Set `NEXT_PUBLIC_SITE_URL` in Netlify if the Netlify URL should be used for canonical URLs and invite links. Set it explicitly for canonical URLs and invite links; the neutral fallback is intended for local or example builds.

## VPS Compatibility

This does not replace the Docker/Caddy VPS deployment. Docker builds still use Next.js standalone output. Netlify builds intentionally do not set standalone output so the Netlify adapter can handle the server build.