# Deployment

GitHub Pages is the recommended deployment for the public, browser-only game. It serves a static export over HTTPS without a VPS, Docker, or reverse proxy. The existing Docker/VPS path remains available for self-hosting or deployments that need server-only behavior.

| Option | Best for |
| --- | --- |
| [GitHub Pages](github-pages.md) | Recommended public static deployment; default PeerJS online play |
| [Docker Compose](docker.md) | Self-hosting and server-controlled deployment |
| [Generic VPS](vps.md) | Optional reverse-proxy deployment |
| [Netlify](netlify.md) | Alternative managed Next.js hosting |

GitHub Pages is static hosting: it does not provide the health endpoint, test-only API routes, custom response headers, or PocketBase transport. PeerJS/WebRTC multiplayer, local storage, themes, localization, and optional external Umami analytics remain supported.