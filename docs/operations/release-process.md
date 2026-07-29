# Release process

The web and Android outputs share one source project, but their distribution paths differ.

## Web

A web release is a validated production build deployed through the selected hosting platform. The deployment must provide the intended environment variables, public origin, privacy routes, health route, sitemap, and robots file.

Local pushes run the repo pre-push hook after `pnpm install`. It executes the release checks locally and cancels the push if any generated artifact needs to be refreshed or if a step fails.

## Android

A tagged Android release creates two outputs from the exported web assets:

| Output | Distribution |
| --- | --- |
| Signed APK | Attached to the GitHub release for direct download, alongside `SHA256SUMS.txt`. |
| Signed Android App Bundle (AAB) | Kept as a private Actions artifact for Google Play upload; it is not a public release download. |

The package identity remains stable. Each Play upload needs a higher Android version code, and App Links use the certificate of the distributed application.

## Credentials

Signing keys, service accounts, deployment credentials, provider tokens, and private fingerprints belong in protected release infrastructure. They must not be committed or exposed in public release assets.