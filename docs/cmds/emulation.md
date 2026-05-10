# Emulation & Testing Commands

Environment emulation, spoofing, and manipulation.

| Command | Description | Aliases |
|---------|-------------|---------|
| `useragent`| `[SUDO]` Overrides the browser's User-Agent string for the active tab. | `ua`, `spoof` |
| `mobile` | `[SUDO]` Emulates a mobile device viewport and User-Agent. | `mob`, `iphone` |
| `throttle`| `[SUDO]` Simulates a slow network connection for the active tab. | `slow`, `lag` |
| `geo` | `[SUDO]` Spoofs HTML5 Geolocation API coordinates. (Note: This is NOT IP spoofing). | `gps`, `location` |
| `ip-spoof`| `[SUDO]` Injects fake IP headers (X-Forwarded-For) into all requests. | `fakeip`, `spoof-ip` |
| `block` | Blocks specific URLs or patterns from loading in the active tab. | `ban`, `deny` |
| `edit` | Toggles designMode to edit text on the live page. | `designmode` |

[⬅ Return to Home](../../README.md)
