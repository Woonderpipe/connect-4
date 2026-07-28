# Maintenance

Maintenance consists of dependency updates, application validation, container updates, and review of external service configuration.

## Application maintenance

Use the package manager and scripts defined by `package.json`. Dependency changes should be accompanied by regenerated license data and a review of privacy-relevant behavior.

## Container maintenance

Rebuild the Compose service when application code or dependencies change. Keep the application port private to the container network and use the reverse proxy for public HTTPS.

## Logs and backups

The application emits minimal redacted operational errors. Host and proxy access logs are deployment-specific and should be rotated by the hosting platform. Back up only deployment configuration and persistent data that the selected release actually uses; do not store credentials or signing keys in the repository.

## Future services

PocketBase support is dormant. Enabling it would require a separate review of authentication, storage, backups, retention, deletion, and privacy documentation.