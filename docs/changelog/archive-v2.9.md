# Archive: Version 2.9.x

## [2.9.3] - 2026-05-11

**The "Registry Completion & UI Stability" Update**

### What's New?

- **Documentation Registry Finalization**: Completed the mapping of all 78+ terminal commands to the new standardized help system.
- **Scrollback Restoration**: Removed the aggressive scrollback buffer clearing (`3J`) to allow users to scroll up and view long command outputs natively.
- **Word-Wrap Precision**: Fixed the `maxW` calculation to prevent breaking words on extremely narrow side-panel displays.

### Fixes & Refinement

- **Example Descriptions**: Applied word-wrapping to the `EXAMPLES & USE CASES` section to ensure consistency with the main description block.
- **Header Robustness**: Added `.trim()` logic to the header detection engine to handle potential whitespace in documentation strings.

## [2.9.2] - 2026-05-11

**The "Architectural Modularization" Update**

### What's New?

- **Help Module Splitting**: Refactored the oversized `detailed-help-web.js` and `detailed-help-tools.js` into domain-specific modules: `detailed-help-dom.js` and `detailed-help-reporting.js`.
- **Lazy-Loading Dispatcher**: Optimized the `detailed-help.js` dispatcher to dynamically import help data on-demand, reducing the initial memory footprint.

### Fixes & Refinement

- **Line Count Compliance**: Ensured all documentation modules strictly adhere to the <200 line architectural constraint.
- **Registry Synchronization**: Verified that all compound commands (e.g., `web -dns`) are correctly discoverable via the `?` trigger.


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
