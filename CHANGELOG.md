# What’s Been Happening? (Changelog) 

All the latest updates and improvements to the WhatHappened terminal.

## [2.4.1] - 2026-04-28
**The "Tab Superpowers" Update**

### What's New?
- **Unified Tab Management**: Commands `tab` and `tabs` are now one. Manage everything without switching context.
- **`tabs diag`**: A new way to scan live tabs! Injects a diagnostic script to find broken images, mixed content (HTTP on HTTPS), slow resources, and DOM bloat.
- **`tabs sleep`**: Save RAM with a single command. "Discard" any background tab to free up memory without closing it.
- **`tabs focus`**: Jump directly to any open tab in your browser by its short index.
- **`tabs info`**: Get a deep dive into a tab's health, including real-time JavaScript heap memory usage and asset count.

### UX & Polish
- **Short Indexes**: No more typing 10-digit Chrome IDs. Use simple numbers like `#1`, `#2`... to close or inspect tabs.
- **Tab Legend**: A new icon system (● Active, Z Idle, z Sleep, Audio, ◌ Loading) with a handy legend at the bottom.
- **Safety First**: Closing a tab now requires a confirmation (`tabs close <#> yes`) to prevent accidental clicks.
- **Clean Grouping**: The tab list is now organized by website, making it easier to manage multiple tabs from the same domain.

### Architecture
- **Atomic Refactor**: Split the massive tabs logic into specialized modules (`tabs-info.js`, `tabs-diag.js`) to keep the codebase fast and maintainable.


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
