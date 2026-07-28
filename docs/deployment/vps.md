# Optional VPS deployment

Use this path only when self-hosting or server-only behavior is required. A typical VPS deployment runs the application container on a private Docker network behind an HTTPS reverse proxy. Caddy, Nginx, Traefik, or another proxy can be used.

## Container topology

- The application listens on port `4444` inside the container.
- The reverse proxy terminates HTTPS and forwards requests to the application.
- The application port should remain private to the Docker network.
- A health endpoint is available at `/api/health/ping`.

## Reverse proxy requirements

Configure the proxy for the selected hostname and forward HTTP and WebSocket traffic to the application container. The proxy configuration is deployment-specific and should not be committed with the application source.

A generic Caddy equivalent is:

```caddyfile
APP_DOMAIN {
    reverse_proxy app:4444
}
```

## DNS and proxy services

DNS providers and edge proxies can be placed in front of the reverse proxy. Use HTTPS from the edge to the origin, keep the application port private, and ensure WebSocket upgrades are supported. Provider-specific settings belong in the hosting environment.

## Logging and operations

Application logs are intentionally minimal. If host or proxy access logs are enabled, configure rotation and retention through the host or proxy platform. Do not store credentials, invite codes, peer identifiers, or user content in logs.

For instance-specific commands and configuration, use the ignored `deploy/vps/` directory.
