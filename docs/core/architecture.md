# Core Architecture (Manifest V3)

**Document Status:** Technical Baseline
**Target Audience:** Core Contributors, Code Auditors

## Executive Summary
WhatHappened operates as a Manifest V3 browser extension providing network diagnostic capabilities via a terminal emulator (TUI). It adopts a browser-local execution model with no backend infrastructure, leveraging Service Workers to query public APIs (DoH, RDAP) from a fetch context that is not subject to page-level CORS restrictions.

---

## 1. System Topology

The architecture is heavily decoupled to enforce Separation of Concerns (SoC) between the DOM (Presentation) and the JavaScript V8 Engine (Logic).

| Module Layer | Implementation | Responsability | Pattern |
| :--- | :--- | :--- | :--- |
| **Presentation** | `terminal-ui.js` | Captures DOM inputs and manages history buffers. | Observer |
| **Lexer/Parser** | `parser.js` | Tokenizes raw input into command pipeline nodes supporting pipes (`\|`). | Strategy |
| **Controller** | `engine.js` | Routes commands and applies pre-execution context guards. | Front Controller |
| **Registry** | `registry.js` | Maps commands to execution logic via dynamic imports. | Lazy Singleton |
| **Rendering** | `progressive-renderer.js` | Manages atomic UI writes and asynchronous batched output. | Queue / Batching |

> **💡 Simple Explanation**
> The system mimics a kitchen: `terminal-ui` is the waiter taking your order. `parser` translates the order into a standard ticket. `engine` is the expeditor checking if the ingredients exist, `registry` holds the recipes, and `progressive-renderer` serves the dish line-by-line.

### Execution Lifecycle & Memory Budgets
Due to Manifest V3's strict memory constraints, the system **does not** load the entire command suite on startup. The `registry.js` employs **Lazy Loading** (`await import()`) to dynamically fetch only the modules requested by the user, keeping the initial bundle size low.

> **⚠️ Latency Note:** Side-panel render time is typically under 100ms. First-command latency on a cold Service Worker start may range from 200–800ms (browser-controlled). Subsequent invocations benefit from the V8 module cache and are typically 20–50ms.

---

## 2. The Shell-Inspired Command Runtime

The runtime implements a browser-native pipe operator (`|`) inspired by Unix shell syntax, routing the RAW output segment of one command to the `stdin` of the next.

> **💡 Simple Explanation**
> Every command outputs three things: raw data (like Linux), a subtle explanation, and color-coded alerts. If you chain commands using a pipe (`|`), the engine strips away the colors and explanations, passing only the raw data to the next command—just like a real terminal.

### The 3-Part Output Standard
Commands in the `modules/commands` directory must yield responses adhering to a strict format:
1. **RAW (Stdout)**: Pure technical data (e.g., DNS A records). This is the only segment that survives a pipe operation.
2. **EXPLAIN (Stderr/Meta)**: Dimmed terminal output contextualizing the action (e.g., `; SERVER: dns.google#443`).
3. **INSIGHTS**: High-contrast diagnostic findings parsed from the raw data.

### Pipeline Sanitization (`cleanForPipe`)
When a pipe token is detected, `engine.js` intercepts the output. It runs `cleanForPipe()`—a sanitization routine that strips ANSI escape codes, insight headers, and explanatory prefixes via Regex—before piping the remaining RAW string to the `stdin` argument of the subsequent node.

---

## 3. Data Resolver Layer

The system uses a Service Worker fetch context — which is not bound by page-level CORS policy — to query public infrastructure (DoH, RDAP) for network diagnostic data.

| Data Target | Source API / Protocol | Execution Context | Confidence Tier |
| :--- | :--- | :--- | :--- |
| **DNS / Sec** | `dns.google/resolve` (DoH) | Main Thread (UI) | **High** (authoritative; subject to propagation state) |
| **Registrar** | RDAP Global | Service Worker | **High** (authoritative at query time; may be redacted per GDPR policy) |
| **Web Host** | A Record → IP RDAP | Service Worker | **~95%** (misses shared-hosting resellers) |
| **NameServers** | NS Domain → Provider Fallback | Main Thread / SW | **~80–90%** (string-match heuristic on NS hostname) |

> **💡 Simple Explanation**
> Browsers enforce CORS at the page level for security. The Service Worker context is not bound by this restriction, so it can query public domain registries (RDAP) and DNS-over-HTTPS endpoints directly.
>
> Confidence tiers vary: the Registrar is read from authoritative RDAP records (high confidence, though GDPR may redact some fields). The Web Host is inferred from the IP's RDAP record (~95% — misses shared-hosting resellers). The NS provider is identified by matching the NS hostname string against known provider patterns (~80–90% accuracy).

---

## 4. Architectural Trade-offs & Limitations

1. **Protocol Constraint (No Native Sockets)**: Operations are limited to OSI Layer 7 (HTTP/WSS). Tools like `nmap` (TCP SYN) or `ping` (ICMP) are emulated (e.g., measuring TTFB via `fetch`).
2. **CORS & Localhost Boundary**: Manifest V3 `<all_urls>` host permissions do not guarantee unimpeded access to `127.0.0.1` or LAN (`192.168.x.x`) due to Private Network Access (PNA) specifications in Chromium.
3. **Service Worker Ephemerality**: The `background.js` context can be terminated by the browser during idle states. Critical session state cannot reside in global SW variables; it must be serialized to the DOM or `chrome.storage.session`.

[⬅ Return to Home](../../README.md)
