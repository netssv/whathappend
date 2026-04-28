# Changelog - WhatHappened

All notable changes to this project will be documented in this file.

## [2.4.0] - 2026-04-27
### Added
- **Command `ip`**: Dual-mode IP discovery (Local public IP/ISP and Domain A record resolution).
- **Command `security-txt`**: RFC 9116 security contact discovery with legacy path fallback.
- **Command `vitals`**: Core Web Vitals scorecard (LCP, CLS, INP) from active tab.
- **Command `flush`**: Scoped clearing of cookies and cache for specific domains (requires `browsingData` permission).
- **Command `notes`**: Persistent session annotations included in JSON exports.
- **Aliases**: Added `myip`, `cwv`, `sec-txt`, `clearcache`, `memo`.

### Changed
- **Speedtest**: Capped maximum download at 90MB to prevent Cloudflare 403 rate-limiting.
- **UI**: Increased terminal viewport padding to 40px for better Windows visibility.
- **Banner**: Updated branding to v2.4.0.

### Fixed
- **History**: Resolved undefined variable reference in certificate transparency insights.
- **Stability**: Enforced Atomic Architecture (200-line limit) across new modules.

## [2.3.3] - 2026-04-25
### Added
- Dynamic heuristic provider mapping (zero static database).
- `scrollToBottom` enforcement in ProgressiveRenderer.

## [2.2.2] - 2026-04-22
### Fixed
- ANSI overwrite ghosting in xterm.js.
- Domain sanitization for subdomains.

## [2.1.0] - 2026-04-20
### Added
- `registrar` and `hosting` commands via RDAP.
- Recursive CNAME follower for DKIM.
- "Command Firewall" for buffer security.
