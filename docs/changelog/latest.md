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

## [2.9.0] - 2026-05-10

**The "Future-Proofing & Modularization" Update**

### What's New?

- **Core Infrastructure Initialization**: Established the foundations for the v2.9 cycle, focusing on modular architecture and performance optimizations.
- **Changelog Fragmentation**: Successfully migrated v2.8 history to the wiki archive to maintain documentation searchability and performance.

### Fixes & Refinement

- **Documentation Synchronization**: Updated the global changelog index and manifest versioning for the new development branch.

[⬅ Return to Home](../../README.md)
