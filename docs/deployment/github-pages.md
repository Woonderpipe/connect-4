# GitHub Pages deployment

GitHub Pages is the recommended deployment for the public browser game. It serves the static Next.js export; the default PeerJS/WebRTC multiplayer mode, local storage, localization, theming, and optional external Umami analytics work without an application server.

## What GitHub Pages does not provide

GitHub Pages cannot run the server-only parts of this repository. The static deployment intentionally excludes:

- `/api/health/ping` and test-only online API routes;
- Next.js response headers and rewrites configured for the server build;
- the PocketBase online transport.

Keep `NEXT_PUBLIC_SERVERLESS=true`. Do not configure a PocketBase URL for this deployment.

## First private trial

1. Push the tested workflow to the private repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages → Run workflow**. The workflow is manual-only.
4. Without repository Variables, the build uses the repository Pages URL and its matching project path. For this repository that is `https://Woonderpipe.github.io/connect-four-private` with base path `/connect-four-private`.
5. Test direct routes, invite links, local play, and online PeerJS play from two independent sessions before public rollout.

Private-repository Pages availability depends on the GitHub plan. The public repository can use GitHub Pages on GitHub Free.

## Repository Variables

Set public values under **Settings → Secrets and variables → Actions → Variables**. They are browser-visible build configuration, so never put credentials there.

| Variable | Private trial value | Custom-domain value |
| --- | --- | --- |
| `PAGES_SITE_URL` | Leave unset to use the repository Pages URL | `https://your-domain.example` |
| `PUBLIC_SITE_URL` | Legacy alias for the same value | `https://your-domain.example` |
| `PAGES_BASE_PATH` | Leave unset to use `/connect-four-private` | `/` |
| `NEXT_PUBLIC_FOOTER_TEXT` | Optional footer label | Optional footer label |
| `NEXT_PUBLIC_PRIVACY_CONTACT_NAME` | Public contact name | Public contact name |
| `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` | Public contact email | Public contact email |
| `NEXT_PUBLIC_UMAMI_*` | Optional external analytics configuration | Optional external analytics configuration |

The workflow maps these Pages-only values to the public Next.js build settings, always forces `NEXT_PUBLIC_SERVERLESS=true` and disables test routes. If you use a custom domain, make sure `PAGES_SITE_URL` or `PUBLIC_SITE_URL` is set to that exact HTTPS origin and `PAGES_BASE_PATH` is `/`.

## Custom domain rollout

After the private Pages trial passes, set the public repository variables to the final HTTPS domain and `/` base path. Add the domain in GitHub Pages settings, configure the DNS records GitHub requests, wait for certificate provisioning, then manually run the workflow again. Build and deploy again whenever the domain or public build variables change.

See GitHub’s [custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for the current Pages-side settings.
