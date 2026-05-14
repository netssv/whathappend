# Contributing to WhatHappened

Welcome! We are thrilled that you are interested in contributing to WhatHappened. This project is built on the philosophy of transparency, privacy ("Zero-Cloud"), and educational infrastructure triage.

This guide will help you get set up, understand our architecture, and submit a successful Pull Request (PR).

---

## 🛠️ Prerequisites & Local Setup

1. **Node.js**: Version 18+ (used strictly for linting and testing; no build step is required for the extension itself).
2. **Google Chrome / Chromium**: For testing the extension locally.

### Loading the Extension in Developer Mode
1. Clone the repository: `git clone https://github.com/netssv/whathappend.git`
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** and select the root directory of this repository.

---

## 🏗️ Architectural Constraints & Code Style

As a Manifest V3 browser extension, we must operate within strict memory and performance budgets. We enforce the following rules:

1. **200-Line Limit (`dev-lint.js`)**: No `.js` file in the `modules/` directory may exceed 200 lines. If a command is too complex, split it into `command.js` (orchestration), `command-core.js` (logic), and `command-ui.js` (rendering).
2. **Zero-Cloud Policy**: You may not add any external analytics, trackers, or telemetry. All external network requests must use `fetch` targeting public, unauthenticated infrastructure (e.g., DNS-over-HTTPS).
3. **CSP Strictness**: No inline event handlers (`onclick="..."`), no `eval()`, and no `new Function()`.
4. **Static Imports Only**: No `import()` with dynamic/variable paths to ensure compatibility with MV3 CSP rules.

---

## 💻 The 3-Step Command Addition Pattern (v3.1.0)

Adding a new command is straightforward thanks to our centralized manifest architecture.

### Step 1: Write the Logic
Create your command file in the appropriate category folder (e.g., `modules/commands/web/my-command.js`). Export an async `exec` function:

```javascript
import { ANSI } from "../../formatter.js";

export async function exec(args, flags) {
    if (args.length === 0) return `${ANSI.red}Error: Missing parameter${ANSI.reset}`;
    return `You executed my command with arg: ${args[0]}`;
}
```

### Step 2: Export it via the Barrel Index
Export your command from the category's `index.js` (e.g., `modules/commands/web/index.js`):
```javascript
export { exec as cmdMyCommand } from "./my-command.js";
```

### Step 3: Register in the Source of Truth
Add the metadata to the definition file in `modules/data/defs/` (e.g., `modules/data/defs/web.js`):
```javascript
export const WEB_COMMANDS = {
    mycmd: {
        category: "WEB",
        desc: "A brief 80-char description",
        aliases: ["my-command"], // Optional
        exec: () => import("../../commands/web/index.js").then(m => m.cmdMyCommand)
    }
};
```
*Note: The UI menus, help pages, and autocomplete arrays will automatically update based on this definition.*

---

## 🚦 Linting & Testing

Before submitting a PR, you **must** run the local checks. Our CI will reject PRs that fail these steps.

**Run the Developer Linter:**
```bash
node dev-lint.js
```
*This checks line limits, validates the `COMMAND_MANIFEST`, ensures no alias collisions, and verifies the `DOMPurify` binary integrity.*

**Run the Test Suite:**
```bash
node --test tests/unit/*.test.js
```
*We use the native `node:test` runner. No external dependencies are required.*

---

## 🔀 Pull Request Process

### 1. Branch Naming
Use conventional prefixes for your branches:
- `feat/` for new features or commands.
- `fix/` for bug fixes.
- `docs/` for documentation updates.
- `chore/` for maintenance or refactoring.

### 2. PR Checklist
When opening a PR, ensure you meet the [Security & Integrity Checklist](.github/PULL_REQUEST_TEMPLATE.md):
- [ ] No new `debugger.sendCommand()` calls outside `throttle.js`.
- [ ] No `eval()` or dynamic import paths.
- [ ] External network data passes through `stripAnsi()` before `xterm.js` writes.
- [ ] `node dev-lint.js` passes locally.
- [ ] Unit tests pass.

Thank you for helping us make WhatHappened the best infrastructure triage tool for the web!
