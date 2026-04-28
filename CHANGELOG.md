# What’s Been Happening? (Changelog) 📅

All the latest updates and improvements to the WhatHappened terminal.

## [2.4.0] - 2026-04-27
**The "UX & Professional Audit" Update**

### What's New?
- **Command `ip`**: Now has a dual-mode! Type it alone to see your own public IP and ISP, or type `ip google.com` to see exactly where a site is hosted.
- **Command `security-txt`**: Easily find out how to contact a site's security team.
- **Command `vitals`**: Added a scorecard for Core Web Vitals (LCP, CLS, INP) so you can see how fast a site really is.
- **Command `tabs`**: View a list of all your open browser tabs and close them directly from the terminal (`tabs close <id>`).
- **Command `flush`**: Need a clean slate? Now you can clear cookies and cache for a specific domain right from the terminal.
- **Command `notes`**: Added a way to take notes during your audit. They stick around for the session and even show up in your JSON exports.
- **Silent Mode**: Domain entry is now much cleaner. It sets the target and fills the header quietly without blocking your screen.
- **Autocomplete+**: The Tab key is now smarter—it suggests flags for domains and even finds domains from your other open tabs.

### Improvements
- **Speedtest**: Capped the download test to play nice with Cloudflare's rate limits.
- **Windows Polish**: Added extra padding so the prompt never feels cramped on Windows screens.
- **Branding**: Shined up the banner for v2.4.0.

### Bug Fixes
- **History**: Fixed a small bug where certificate transparency info wasn't displaying correctly.
- **Code Quality**: Refactored the engine to keep it fast, atomic, and easy to maintain.

---

## [2.3.3] - 2026-04-25
- **Smarter Mapping**: Removed all static provider lists. The terminal now figures out who hosts a site using 100% live data.
- **Better Scrolling**: Forced the terminal to stay at the bottom while it's printing long results.

## [2.1.0] - 2026-04-20
- **New Commands**: Added `registrar` and `hosting` to get deep lifecycle and provider data.
- **DKIM Discovery**: Added a clever way to find DKIM selectors without needing a database.
- **Command Firewall**: Locked down the terminal buffer to keep things extra secure.
