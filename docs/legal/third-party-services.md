# Third-party services

This inventory describes external services and the data surfaces they may process. Provider terms and deployment configuration determine the final details. The absence of user accounts does not by itself mean that a service processes no data.

| Service or infrastructure | Purpose | Data and configuration considerations |
| --- | --- | --- |
| PeerJS signaling | Establishes online match connections | Peer identifiers, connection metadata, network information, and provider processing |
| Browser/WebView WebRTC | Provides the peer data channel | Network metadata and connection behavior depend on the browser and platform |
| PocketBase | Dormant future account functionality | Not part of the default online transport or current production data flow |
| Netlify | Optional web hosting and build service | Build logs, deployment access, environment values, requests, and retention follow provider settings |
| VPS and reverse proxy | Optional self-hosted web delivery | TLS, access logs, backups, monitoring, and retention follow the deployment |
| GitHub | Source hosting and collaboration | Repository, Actions, issues, and access-control data follow repository settings |
| Google Play | Android distribution | Signing, store listing, policy declarations, and release telemetry follow Play Console settings |

## Analytics and logging

- Umami is optional and enabled only through the explicit environment toggle and valid website configuration.
- Analytics events contain fixed aggregate properties and do not include gameplay content or invite identifiers.
- Application errors are minimal and redacted.
- Host and reverse-proxy logs are controlled by the selected deployment.

Review this inventory when a provider, transport, analytics setting, backend, permission, or hosting model changes.