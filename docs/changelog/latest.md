# What’s Been Happening? (Changelog)

All the latest updates and improvements to the WhatHappened terminal.

## 🛠 Developer Notes (Must Read)

If you are extending the terminal or adding new commands, you MUST verify the following modules to ensure UX consistency and atomic compliance:

1. `modules/data/defs/...`: Define your new command inside the appropriate category definition file. This is the single Source of Truth.
2. `modules/data/command-manifest.js`: Ensure your category definition is exported here.
3. `COMMANDS.md` & `README.md`: Keep user-facing docs updated.
4. `modules/commands/.../index.js`: Ensure your function is exported from its domain folder.
5. `dev-lint.js`: Run this script to verify your code respects the 200-line ceiling and subcommand conventions.

## [3.2.0] - 2026-05-13

**The Architectural Maturation & Stability Update**

### What's New?

- **Service Worker Reconnection Protocol (MV3-1)**: Implemented a robust background heartbeat `setInterval` ping from the `terminal-main.js` panel to the `router.js` service worker. This entirely prevents the extension from silently crashing or hanging during long-running tasks like `speedtest` or `watch`.
- **Extreme 200-Line Modularity (D2)**: Refactored and condensed the entire codebase. All 284 modules now strictly adhere to the <200 lines-per-file architectural constraint. Massive files like `header-block.js` were completely split into separated UI logic and business logic layers.
- **Collision-Proof Help Categories (D3)**: Eliminated fragile string-splitting logic used to render the Help UI categories. Replaced it with a deterministic, explicitly defined `key` system inside the command manifest `defs/`, ensuring absolute consistency.
- **Architectural Documentation Overhaul**: Completely rewrote the `module_overview.md` to reflect the 100% local-execution architecture, user impact, and the POSIX pipe (`|`) emulation data pipeline standards.

---
*Looking for older updates?* [View v3.1 Archive](./archive-v3.1.md) | [View v2.9 Archive](./archive-v2.9.md) | [View v2.8 Archive](./archive-v2.8.md)

[⬅ Return to Home](../../README.md)
