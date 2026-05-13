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

## [3.0.2] - 2026-05-12

**Enterprise Security Migration & Architectural Refactor**

### What's New?

- **Enterprise-Grade DOM Sanitization**: Replaced the custom `sanitize.js` recursive tree walker with the industry-standard **DOMPurify** library. This neutralizes complex Mutation XSS (mXSS) vectors and ensures compliance with Chrome Web Store security audits.
- **Dependency Isolation**: Bundled `dompurify.min.js` locally to adhere to the Zero-Cloud policy, preventing external supply chain attacks.
- **Architectural Documentation**: Completely rewrote the project's technical documentation (`architecture.md`, `security.md`, `permissions.md`) to reflect Enterprise software design patterns, explicitly mapping out execution constraints and threat mitigation strategies.

## [3.0.1] - 2026-05-11

**The "Documentation Standardization & TUI Stability" Milestone**

### What's New?

- **100% Documentation Standardization**: Every command in the terminal suite now follows a professional "WHAT IS IT?" / "REAL USE CASES" format, automatically styled with bold white headers for maximum readability.
- **Architectural Modularization**: To maintain high performance and clean code standards, the documentation registry has been split into 10+ theme-specific modules, each strictly adhering to the <200 line-per-file constraint.
- **Native Scrolling Experience**: The help system now uses native terminal scrolling, allowing users to leverage trackpads, mouse wheels, and scrollbars to view long documentation without losing the top-level command headers.
- **Dynamic Header Rendering**: Refactored the help renderer to automatically detect and style section headers, reducing technical debt and ensuring consistency across all future command modules.

### Fixes & Refinement

- **Xterm.js Scrollback Fix**: Resolved a critical issue where clearing the scrollback buffer (`\x1b[3J`) caused long help text to be truncated.
- **Word-Wrap Precision**: Enhanced the wrapping engine to prevent breaking words (e.g., "switch" into "switc-h") in command examples and descriptions, ensuring a smooth read on narrow side-panel displays.
- **Dispatcher Reliability**: Optimized the lazy-loading dispatcher to handle compound commands and aliases more robustly during help lookup.

---
*Looking for older updates?* [View v2.9 Archive](./archive-v2.9.md) | [View v2.8 Archive](./archive-v2.8.md)

[⬅ Return to Home](../../README.md)
