# What’s Been Happening? (Changelog)

All the latest updates and improvements to the WhatHappened terminal.

## 🛠 Developer Notes (Must Read)

If you are extending the terminal or adding new commands, you MUST verify the following modules to ensure UX consistency and atomic compliance:

1. `COMMANDS.md` & `README.md`: Keep user-facing docs updated.
2. `modules/commands/util/detailed-help.js`: For the interactive `cmd?` help.
3. `modules/commands/util/help.js`: For the main `help` menu categorizations.
4. `modules/data/autocomplete-data.js`: Ensure your command tab-completes correctly.
5. `modules/data/aliases.js`: Register any shortcuts and add the root command to `ALL_KNOWN_CMDS`.
6. `modules/core/registry.js`: Add your function to the command registry map.
7. `modules/commands/.../index.js`: Ensure your function is exported from its domain folder.

## [2.7.5] - 2026-05-04

**The "Watcher Lifecycle" Update**

### What's New?

- **WatchLifecycle Manager**: Introduced a robust infrastructure to manage network monitoring sessions, ensuring better stability and resource cleanup.
- **Interactive Tab Switching**: Added a modal choice dialog (`showChoice`) that triggers when navigating away from a tab with an active watcher, allowing users to choose between switching or terminating the session.
- **Enhanced Badge States**: Optimized extension badge notifications to provide clearer real-time status of active monitoring.

### Refinements & Architecture

- **Watcher Modularization**: Refactored the `Waterfall`, `Raw`, and `Dashboard` watchers into decoupled units for improved maintainability.
- **Tab Lifecycle Integration**: Centralized tab-event handling to prevent terminal state desync during rapid navigation.
- **Stability Fixes**: Resolved the "Blank Screen" initialization bug occurring during heavy network monitoring sessions.

---

## [2.7.4] - 2026-05-03

**The "Universal Navigation" Update**

### What's New?

- **Interactive Navigation Menu (`nav`)**: Introduced a fully stabilized Text User Interface (TUI) navigation lifecycle, preventing accidental menu loops and ensuring consistent state management. Includes state persistence for returning to the last viewed category.
- **Tab Management System**: Deployed robust TUI menu, list, and resolver modules for seamless command execution across open tabs.
- **Post-Command Flow**: Added mandatory "Press any key" pauses after command execution, giving users time to read the output before the UI resets.

### Fixes & Refinements

- **Auto-Triage & SSL**: Updated background auto-triage logic to seamlessly follow redirects and handle broader HTTP status codes during SSL verification.
- **Game Engine Paths**: Corrected absolute module import paths in terminal games to fix initialization errors (blank screen bug).
- **Global Visibility**: Registered new navigation tools across the command help and autocomplete systems for full platform coverage.

---

## [2.7.3] - 2026-05-03

**The "Peek UI" Update**

### UX & Interface

- **Decorative Peek Tab**: Replaced the traditional infrastructure triad handle with a new "Peek" UI tab, featuring engaging bounce and reveal animations.
- **Domain Change Tracker**: Implemented a background listener to automatically detect domain changes and reset triage state.

---

## [2.7.2] - 2026-05-03

**The "Modular Framework & Modals" Update**

### Architecture & UI

- **Internal Modal System**: Replaced inline confirmation logic (e.g., `flush`, `exit`, `geo remove`, `config reset`) with a standardized, internal modal dialog system to prevent accidental data loss and standardize the user experience.
- **Modular Infrastructure**: Atomized the terminal's infrastructure by decoupling command logic from the UI. Extracted renderers and timers into standalone modules (e.g., `geo.js` and `hack.js`).
- **Persistent Geolocation**: Implemented a persistent `geo` command suite (`add`, `remove`, `list`) backed by `chrome.storage.local` with a dynamic "Add Location" workflow using the new modal UI.
- **Triad Auto-Show Optimization**: Removed intrusive auto-show triggers for the infrastructure triad, ensuring the header only appears during relevant network diagnostic events or manual interaction.

---

## [2.7.1] - 2026-05-02

**The "UX & Menu Polish" Update**

### Bug Fixes & UX

- **Menu Architecture**: Fixed the "Accordion Hover Trap" in narrow viewports by replacing jittery hover animations with a solid click-to-expand system for inline menus.
- **Safe Hover Lane**: Re-engineered the menu overlay logic to prevent submenus from physically blocking navigation paths.
- **Visual Clarity**: Updated nested menu indicators to native `▸`/`▾` arrows with smooth rotation states, and disabled false-click interactions on category headers.

---

## [2.7.0] - 2026-05-02

**The "RECON & Emulation" Update**

### What's New?

- **DNS Map (`map`)**: A visual ASCII representation of the domain resolution journey.
- **RECON Suite**: New commands `emails`, `phones`, `comments`, and `cms` to extract critical data from the DOM.
- **Emulation Suite**: Comprehensive tools to test sites from different perspectives, including `useragent`, `mobile`, `throttle`, and `geo`.
- **Security Scanner (`malware`)**: Client-side heuristic scanner to detect known malicious patterns.
- **Design Tools (`edit`, `fonts`, `palette`)**: Toggle design mode, check typography, and extract color palettes directly from the terminal.

### Architecture & Polish

- **Modular UI**: Refactored `terminal.html` into a cleaner template system with dynamic menu loading.
- **Keyboard Shortcuts**: Added reliable Chrome shortcuts: `Ctrl+Shift+.` (Toggle Panel) and `Ctrl+Shift+,` (Reload).
- **Bug Fixes**: Fixed ANSI italic rendering issues and improved CNAME chain resolution in DNS lookups.

[⬅ Return to Knowledge Map](../map.md)
