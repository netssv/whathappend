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

## [2.8.4] - 2026-05-09

**The "Stability & Responsive UI" Update**

### What's New?

- **Mathematical Margin Stabilization**: Implemented a new "Absolver" logic that calculates the exact pixel remainder of the terminal grid. This ensures the prompt (`❯`) is always perfectly anchored to the bottom padding, eliminating clipping during font resizing.
- **Responsive Table Layouts**: Rebuilt the `cookies` and `tab list` commands with responsive rendering. Tables now intelligently truncate names and hostnames based on the actual terminal width, preventing layout breaks in narrow side panels.
- **Linux-Friendly Flag Support**: Updated the command parser to support long flags with a single dash (e.g., `-persist`, `-close`, `-watch`). This bridges the gap between POSIX short flags and the user's desire for a Linux-like CLI experience.
- **High-Density Tab Table**: Refactored `tab list` into a unified table layout (resembling `ps` or `top`). It now displays ID, Status, Host, and Title in perfectly aligned columns.
- **Enhanced Command Registry**: Fixed a regression in the command router that was dropping flags for certain web audit tools, restoring full functionality to `--persist` and `--keepalive` workflows.

### Fixes & Refinement

- **Code Modularization**: Refactored `terminal-ui.js` (extracting font and resize logic to `terminal-resize.js`) to maintain the strict <200 line architectural ceiling.
- **Autocomplete Synchronization**: Fixed a bug where autocompleted flags with single dashes were being fragmented by the parser.

## [2.8.3] - 2026-05-08

**The "Power User & POSIX Pipelines" Update**

### What's New?

- **AST Pipeline Engine**: The terminal now features a real command execution engine with support for pipes (`|`). You can chain commands like `dig google.com mx +short | grep google | wc -l`.
- **POSIX-Style Flags**: Complete refactor of the argument parser to support standard Linux conventions:
    - **Grouped short flags**: `-la` is now correctly expanded to `-l -a`.
    - **Long flags**: Proper differentiation between `-v` and `--version`.
- **Native Pipe Utilities**: Added dedicated filter stages to the command registry:
    - `grep`: Native implementation for filtering output lines (supports `-i` and `-v`).
    - `wc`: Word, line (`-l`), and character count utility.
    - `sort`: ASCII-based alphabetical and numerical (`-n`) sorting.
- **Dynamic Shell Prompt**: The prompt now reflects the **active tab target** (like a hostname) and displays the **execution time** for heavy commands (e.g., `[1.2s]`).
- **Readline Editing Shortcuts**: Increased keyboard efficiency with standard shell shortcuts:
    - `Ctrl+A` / `Ctrl+E`: Jump to start/end of line.
    - `Ctrl+W`: Delete word before cursor.
    - `Ctrl+K`: Kill text from cursor to end of line.
- **Privileged Mode (sudo)**: Introduced a formal `ContextManager` state for privileged operations, enabling future high-impact network diagnostic commands.

### Fixes & Refinement

- **Parser Sanitization**: Pipelines now strip cosmetic terminal extras (like `[INFO]` or command echoes) when passing data between stages, ensuring `wc` and `sort` receive only raw data.
- **Terminal UI Modularization**: Refactored `terminal-ui.js` and `keyboard-events.js` into smaller modules (`terminal-prompt.js`, `keyboard-shortcuts.js`) to maintain a strict <200 line ceiling for better maintainability.

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
