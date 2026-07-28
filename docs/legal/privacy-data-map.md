# Privacy data map

This map summarizes behavior visible in the source code. It supports privacy-policy maintenance but is not itself a privacy policy.

## Runtime behavior

| Surface | Behavior | Data location or transfer |
| --- | --- | --- |
| Local game state | Stores the current board, turn, timers, history, mode, and variant in local storage | Device-local browser or Android WebView storage |
| Local preferences | Stores statistics, color theme, language, appearance preference, and tabletop mode | Device-local browser or Android WebView storage |
| PeerJS online mode | Creates a random peer identifier and exchanges gameplay messages through the online connection | PeerJS signaling and WebRTC infrastructure |
| WebRTC | Uses browser/WebView connection discovery and transport | Network and connection metadata may be visible to infrastructure or peers |
| PocketBase | Dormant helpers for possible future accounts | No current default-release processing |
| Share and clipboard | Sends invite text or link after an explicit user action | User-selected app or operating-system clipboard |
| Umami | Loads only when explicitly enabled and fully configured; sends fixed events without identification | Configured self-hosted analytics endpoint |
| Test routes | Available only under non-production test configuration | Test process memory and request data |
| Android network | Requests `INTERNET`; release configuration disables cleartext traffic | HTTPS, WSS, and WebRTC traffic |

## Local storage keys

- `connect4_stats`
- `connect4_theme`
- `connect4_language`
- `connect4_tabletop_mode`
- `connect4_current_game`
- `theme` (shared System/Light/Dark preference managed by `next-themes`)

`connect4_dark_mode` is read once only to migrate earlier installations to the shared appearance preference, then removed.

Update this map when storage, permissions, providers, analytics events, or transport behavior changes.