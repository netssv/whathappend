# Archive: Version 2.9.x

## [2.9.1] - 2026-05-10

**The "Power User Experience & TUI Refinement" Update**

### What's New?

- **Help Documentation on Steroids**: Massive refactor of the `detailed-help.js` module. Command documentation now features a structured, professional layout with sections for Description, Syntax, Aliases, and detailed Use Cases.
- **Enhanced Paused Navigation**: Command results and documentation views now support native scrolling via mouse wheel and keyboard arrows (Up/Down/PageUp/PageDown) without accidentally returning to the menu.
- **Unified Column Architecture**: Transitioned all TUI grid layouts to a single-column architecture for improved visual consistency and a cleaner aesthetic, regardless of terminal width.

### Fixes & Refinement

- **Input Dispatcher Fixes**: Resolved a critical bug where mouse clicks on navigation numbers weren't correctly detected.
- **Screen Clearing Logic**: Improved the transition between the help menu and detailed documentation by ensuring a full screen wipe to prevent UI artifacts.
- **Audit Formatting**: Corrected a missing newline in the SEO audit module that caused insights to overlap with execution telemetry.

## [2.9.0] - 2026-05-10

**The "Future-Proofing & Modularization" Update**

### What's New?

- **Core Infrastructure Initialization**: Established the foundations for the v2.9 cycle, focusing on modular architecture and performance optimizations.
- **Changelog Fragmentation**: Successfully migrated v2.8 history to the wiki archive to maintain documentation searchability and performance.

### Fixes & Refinement

- **Documentation Synchronization**: Updated the global changelog index and manifest versioning for the new development branch.

[⬅ Return to Latest Changelog](./latest.md)
