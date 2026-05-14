# Archive (v3.0.x - v3.1.x)

## [3.1.0] - 2026-05-12

**Command Manifest Inversion of Control & Autocomplete Decoupling**

### What's New?

- **Centralized Command Manifest**: Re-architected the command registry to use a distributed metadata manifest (`modules/data/defs/`). This serves as the single Source of Truth for command names, aliases, categories, and execution paths.
- **Dynamic Autocomplete Engine**: Decoupled `autocomplete-data.js` from static visual help files. Autocomplete and subcommands are now automatically derived from the command manifest, eliminating manual synchronization.
- **Dynamic Help UI**: The `help-data.js` module now dynamically generates the visual help categories based directly on the manifest data, ensuring perfect consistency between what is documented and what is executable.

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
