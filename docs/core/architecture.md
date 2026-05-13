# Core Architecture (Manifest V3)

**Document Status:** Technical Baseline
**Target Audience:** Core Contributors, Code Auditors

## Executive Summary
WhatHappened operates as a Manifest V3 browser extension providing network diagnostic capabilities via a terminal emulator (TUI). It leverages an event-driven "Zero-Cloud" architecture, utilizing Service Workers to bypass CORS restrictions for public intelligence gathering (DoH, RDAP) while maintaining strict local execution boundaries.

---

## 1. System Topology

The architecture is heavily decoupled to enforce Separation of Concerns (SoC) between the DOM (Presentation) and the JavaScript V8 Engine (Logic).

| Module Layer | Implementation | Responsability | Pattern |
| :--- | :--- | :--- | :--- |
| **Presentation** | `terminal-ui.js` | Captures DOM inputs and manages history buffers. | Observer |
| **Lexer/Parser** | `parser.js` | Tokenizes raw input into AST nodes supporting pipes (`\|`). | Strategy |
| **Controller** | `engine.js` | Routes commands and applies pre-execution context guards. | Front Controller |
| **Registry** | `registry.js` | Maps commands to execution logic via dynamic imports. | Lazy Singleton |
| **Rendering** | `progressive-renderer.js` | Manages atomic UI writes and asynchronous batched output. | Queue / Batching |

> **💡 Simple Explanation**
> The system mimics a kitchen: `terminal-ui` is the waiter taking your order. `parser` translates the order into a standard ticket. `engine` is the expeditor checking if the ingredients exist, `registry` holds the recipes, and `progressive-renderer` serves the dish line-by-line.

### Execution Lifecycle & Memory Budgets
Due to Manifest V3's strict memory constraints, the system **does not** load the entire command suite on startup. The `registry.js` employs **Lazy Loading** (`await import()`) to dynamically fetch only the modules requested by the user, keeping the initial bundle size low and boot times under 100ms.

---

## 2. The Execution Engine & POSIX Emulation

The core technical achievement of the extension is emulating POSIX-style command chaining (`|`) within a restricted browser sandbox.

> **💡 Simple Explanation**
> Every command outputs three things: raw data (like Linux), a subtle explanation, and color-coded alerts. If you chain commands using a pipe (`|`), the engine strips away the colors and explanations, passing only the raw data to the next command—just like a real terminal.

### The 3-Part Output Standard
Commands in the `modules/commands` directory must yield responses adhering to a strict format:
1. **RAW (Stdout)**: Pure technical data (e.g., DNS A records). This is the only segment that survives a pipe operation.
2. **EXPLAIN (Stderr/Meta)**: Dimmed terminal output contextualizing the action (e.g., `; SERVER: dns.google#443`).
3. **INSIGHTS**: High-contrast, actionable intelligence parsed from the raw data.

### Pipeline Sanitization (`cleanForPipe`)
When a pipe token is detected, `engine.js` intercepts the output. It runs `cleanForPipe()`—a sanitization routine that strips ANSI escape codes, insight headers, and explanatory prefixes via Regex—before piping the remaining RAW string to the `stdin` argument of the subsequent node.

---

## 3. Data Resolvers & Heuristic Engine

The system resolves network topologies by circumventing inherent frontend XHR/Fetch limitations.

| Data Target | Source API / Protocol | Execution Context | Heuristic Certainty |
| :--- | :--- | :--- | :--- |
| **DNS / Sec** | `dns.google/resolve` (DoH) | Main Thread (UI) | **100%** (Public State) |
| **Registrar** | RDAP Global | Service Worker | **100%** (ICANN Baseline) |
| **Web Host** | A Record -> IP RDAP | Service Worker | **~95%** (Misses Resellers) |
| **NameServers** | NS Domain -> Provider Fallback | Main Thread / SW | **~80-90%** (String Fallback) |

> **💡 Simple Explanation**
> Browsers block direct network scanning for security. To bypass this safely: we ask Google's public servers for DNS records, and we use our background "Service Worker" to query global domain registries (RDAP) without triggering CORS blocks.
>
> Certainty levels vary: Finding the Registrar is 100% accurate (like checking an ID). Finding the Web Host is ~95% accurate (we find the building owner, but not necessarily the tenant). Guessing the NameServer provider is ~90% accurate (we deduce the provider by the domain name itself, e.g., `ns1.digitalocean.com`).

---

## 4. Architectural Trade-offs & Limitations

1. **Protocol Constraint (No Native Sockets)**: Operations are limited to OSI Layer 7 (HTTP/WSS). Tools like `nmap` (TCP SYN) or `ping` (ICMP) are emulated (e.g., measuring TTFB via `fetch`).
2. **CORS & Localhost Boundary**: Manifest V3 `<all_urls>` host permissions do not guarantee unimpeded access to `127.0.0.1` or LAN (`192.168.x.x`) due to Private Network Access (PNA) specifications in Chromium.
3. **Service Worker Ephemerality**: The `background.js` context can be terminated by the browser during idle states. Critical session state cannot reside in global SW variables; it must be serialized to the DOM or `chrome.storage.session`.

[⬅ Return to Home](../../README.md)
