# Docker Compose deployment

The repository includes a generic Docker Compose configuration for running the web application in a container. A reverse proxy can provide the public HTTPS endpoint.

## Build and run

Create `deploy/docker/.env.production` from
`deploy/docker/.env.production.example`, then run:

```bash
docker compose --env-file deploy/docker/.env.production -f deploy/docker/docker-compose.prod.yml build
docker compose --env-file deploy/docker/.env.production -f deploy/docker/docker-compose.prod.yml up -d
docker compose --env-file deploy/docker/.env.production -f deploy/docker/docker-compose.prod.yml ps
```

The application listens on port `4444` inside the container. The Compose configuration exposes it to the Docker network rather than publishing it directly to the public Internet.

## Configuration and secrets

Values beginning with `NEXT_PUBLIC_` are build-time client configuration and must not contain secrets. Compose passes them to the Docker build explicitly; runtime `env_file` alone is too late for browser-visible values. The current application does not require Docker secrets. If a future server-side integration adds private credentials, provide them through the hosting platform or Docker Compose secrets mounted under `/run/secrets`.

## Operations

Update the image by rebuilding the Compose service. Stop the service with `docker compose down`; this does not remove external Docker networks. Keep host and proxy logs under the host platform retention policy and never log invite codes, peer identifiers, or user content.