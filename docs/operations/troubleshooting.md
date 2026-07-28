# Troubleshooting

## Container will not start

```bash
docker compose --env-file deploy/docker/.env.production -f deploy/docker/docker-compose.prod.yml logs --tail=200 app
docker compose --env-file deploy/docker/.env.production -f deploy/docker/docker-compose.prod.yml config
```

Check the environment file, image build output, and whether the app is healthy on port 4444 inside the container.

## Public site returns 502

Confirm the application and reverse-proxy services share the intended private Docker network, then validate and restart the proxy configuration. Do not expose port 4444 publicly as a workaround.

## Online play does not connect

Confirm the public site is HTTPS, PeerJS/serverless mode is enabled, test routes are disabled, and the browser/WebView has network access. Invite codes and peer identifiers must not be pasted into public logs.

## Android deep links fail

Check the custom scheme first. For HTTPS App Links, deploy `assetlinks.json` with the Play App Signing SHA-256 fingerprint and reinstall the application on the test device.

## CI or license check fails

Use Node 24 and pnpm 11.15.1, run the Capacitor sync before the license scan, then run `corepack pnpm licenses:generate` and `corepack pnpm licenses:check`. Do not manually edit generated catalog or notice files.
