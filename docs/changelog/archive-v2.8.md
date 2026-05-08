# Archive v2.8.x

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

[⬅ Return to Home](../../README.md)
