# Service and data inventory

This inventory describes the services and runtime surfaces used by the application. Actual retention and processing depend on the selected deployment and provider configuration.

| Service or surface | Function | Potential data or metadata |
| --- | --- | --- |
| Browser or Android storage | Local games, settings, and statistics | Game state and preferences stored on the device |
| PeerJS and WebRTC | Online match signaling and connection | Peer identifiers, connection metadata, network information, and exchanged game state |
| Umami | Optional aggregate analytics | Page views and fixed event properties when enabled |
| Hosting and reverse proxy | Serves the web application | Request and operational metadata according to provider settings |
| Share sheet and clipboard | User-requested invite sharing | Invite link and text sent to the selected destination |
| Build tooling | Produces web and Android artifacts | Tool telemetry according to tool defaults and environment settings |

PocketBase code is retained for possible future account support but is not part of the default online transport or current production data flow.

The application does not include advertising, billing, account processing, or crash-reporting SDKs by default.