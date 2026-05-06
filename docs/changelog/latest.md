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
8. `dev-lint.js`: Run this script to verify your code respects the 200-line ceiling and subcommand conventions.

## [2.8.2] - 2026-05-06

**The "Smarter Triage & Better Visibility" Update**

### What's New?

- **Automatic Site Intel**: The header now starts scanning immediately when you switch tabs or open the panel. You get immediate data on HTTP status, SSL, and hosting without having to wait or type anything.
- **Visual Block Counter**: The block panel now tells you exactly how many items (like images or scripts) were neutralized on the current page. It's a great way to see the actual impact of your blocking rules in real-time.
- **Pinned Panel Mode**: You can now keep the block panel open permanently. Just double-click the shield icon to pin it. This is perfect if you need to toggle settings frequently across different tabs without the panel auto-hiding.
- **Enhanced Readability**: We've increased font sizes and improved text contrast across the board. Hints, notes, and technical data are now much easier to read, especially on dark backgrounds.
- **Improved Interaction**: The auto-hide delay for panels has been increased. You now have more time to read and process the diagnostic data before the UI collapses back into its compact state.

## [2.8.1] - 2026-05-05

**The "Security Hardening & CWS Compliance" Update**

### What's New?

- **On-Demand Debugger Access**: The `debugger` permission is now an `optional_permission`. Commands `throttle` and `block` request it at runtime via `chrome.permissions.request()`, reducing the install-time permission footprint.
- **External Fallbacks**: When debugger access is denied, `throttle` and `block` now display fallback links to WebPageTest and PageSpeed Insights for equivalent analysis.
- **HTML Sanitizer**: New `sanitize.js` module provides `sanitizeHTML()` with a whitelist of safe tags, and `clearElement()` as a modern alternative to `innerHTML = ""`.

### Security & Privacy

- **Permission Reduction**: Removed `clipboardRead` (unnecessary in MV3 side panel context) and `notifications` (replaced by in-terminal alerts). Net reduction: 3 fewer install-time permissions.
- **DOM XSS Mitigation**: Replaced all `innerHTML` assignments involving user-derived data (domain names, tab titles, error messages, geo labels) with safe DOM construction using `textContent` and `createElement`.
- **Sanitized Modals**: `modal-confirm.js` and `modal-form.js` now use `sanitizeHTML()` for message content and `clearElement()` for DOM clearing.
- **Break Timer Overhaul**: `coffee.js` alert replaced `chrome.notifications` with a document title flash animation — zero permissions required.

### Architecture & Polish

- **Debugger Guard Module**: New `debugger-guard.js` centralizes permission checking and fallback messaging for CDP-dependent commands.
- **Documentation Overhaul**: Complete rewrite of `permissions.md` with full justification table, optional permissions section, and security guarantees.
- **Version Synchronization**: Centralized version strings across manifest, UI, banner, and helper modules.

[⬅ Return to Home](../../README.md)
