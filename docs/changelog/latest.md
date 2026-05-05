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

## [2.8.0] - 2026-05-04

**The "Unified Content & Code Quality" Update**

### What's New?

- **Unified Extract Engine**: Replaced disparate scraper tools with a consolidated `extract` command suite.
- **Terminal Export**: Added `--clip` flags to effortlessly export formatted data blocks into the clipboard.
- **Automated Dev Linting**: Added a `dev-lint.js` utility that automatically checks code modularity (200-line limits) and subcommand nomenclature.

### Architecture & Polish

- **Atomic File Refactoring**: Drastically simplified `extract.js` by splitting it into `extract-scrapers.js` (DOM interactions) and `extract-format.js` (UI layout).
- **Subcommand Conventions**: Documented the "Dash or No Dash" nomenclature for terminal flag handling vs configuration keys.
- **Emoji Audit**: Reduced and standardized terminal output emoji usage per the new minimalist conventions.

[⬅ Return to Knowledge Map](../map.md)
