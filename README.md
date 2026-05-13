# WhatHappened (v3.1.x)
**Web Infrastructure Triage & Network OSINT Terminal**

WhatHappened is a Manifest V3 browser extension providing network diagnostic capabilities via a local terminal emulator (TUI). It enables deep technical auditing of any visited domain directly from the Chrome side-panel.

---

## 1. Project Philosophy & Value Proposition

> **Simple Explanation**
> Ever find yourself jumping between 10 different tabs just to check a DNS record, see why an SSL certificate is acting up, or figure out who is actually hosting a site? WhatHappened is a simple, powerful terminal that lives right in your browser. It tells you exactly what’s going on under the hood of any website you’re visiting—without the clutter, without the tracking.

**Technical Overview:**
WhatHappened operates strictly on the edge. It brings POSIX-style command chaining (`|`), live DOM inspection, and public intelligence gathering (RDAP, DoH) into a Zero-Cloud execution environment. There are no backend servers, no analytics, and no mandatory external API keys.

---

## 2. Official Documentation

The documentation has been refactored to comply with Enterprise Architecture standards, separating simple onboarding from rigorous technical baselines.

### Architecture & Security (Engineers)
- [Architecture & Internals](docs/core/architecture.md): Execution flow, Pipelines, Lazy Loading.
- [Security & Privacy Policy](docs/core/security.md): XSS mitigation, Sudo Gate, Zero-Cloud policy.
- [Permissions Scope & Compliance](docs/core/permissions.md): Chrome Web Store compliance details.

### User Guides (Operators)
- [Quick Start Guide](docs/guides/quick-start.md)
- [All Commands (API Reference)](COMMANDS.md)

---

## 3. Key Architectural Features

| Feature | Implementation Pattern | Benefit |
| :--- | :--- | :--- |
| **POSIX Emulation** | Custom AST Parser | Supports complex command pipelines (e.g., `dig \| grep IP`). |
| **Memory Efficiency** | Lazy Loading / Dynamic Import | Modules load strictly on-demand, bypassing MV3 bundle limits. |
| **XSS Immunity** | `xterm.js` + DOMPurify | Raw rendering combined with enterprise DOM sanitization prevents injection from hostile data. |
| **Zero-Cloud Recon** | Service Worker Fetch Proxies | Bypasses CORS locally to query global RDAP/DoH registries securely. |

---

## 4. Contributing & License

We adhere to Open Source Engineering Standards. When contributing, please ensure your code respects the `cleanForPipe()` pipeline constraints and utilizes `DOMPurify` (or the internal sanitizer) for any reactive DOM injections.

**License:** MIT
