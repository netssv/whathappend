# Security & Privacy Policy

**Document Status:** Production Baseline
**Scope:** Manifest V3 Compliance & XSS Mitigation

## 1. The Zero-Cloud Policy

WhatHappened is architected as an **Edge-Side/Local-Only** application.

> **💡 Simple Explanation**
> We have no servers, no databases, and no analytics tracking you. Everything happens directly inside your browser. The tool only talks to public internet infrastructure (like Google DNS) to fetch public records.

**Technical Details:**
- **No Telemetry**: The codebase contains zero analytics tracking scripts or crash reporters.
- **No Backend**: Data processing, AST parsing, and heuristic analysis occur exclusively within the V8 engine of the local Chrome instance.
- **Stateless Operations**: Session data is ephemeral. History is persisted strictly locally via `chrome.storage.local` with no cloud synchronization.

## 2. Inbound Data Security (XSS Mitigation)

Because the extension fetches and renders untrusted third-party data (HTTP headers, WHOIS responses, DNS TXT records), it assumes all inbound data is potentially hostile. It employs a **Defense-in-Depth** strategy:

| Defense Layer | Implementation | Target Threat |
| :--- | :--- | :--- |
| **Engine (Hardware)** | `manifest.json` CSP | `eval()`, inline scripts, external injection |
| **Terminal Canvas** | `xterm.js` | Script execution via console stdout |
| **DOM Tree** | `DOMPurify` (Standard) | mXSS, attribute injection (`on*`), broken markup |

> **💡 Simple Explanation**
> If a hacker puts `<script>alert('hack')</script>` inside a website's HTTP headers, our terminal won't execute it. The terminal acts like safety goggles: it only sees raw text. Furthermore, Chrome's internal security (CSP) acts as an iron vault, actively blocking any attempt to run malicious code from external sources. Finally, for any dynamic UI element, we use DOMPurify, an industry-standard scanner that acts like an X-Ray, filtering out any hidden traps before they reach the screen.

**Technical Details:**
- **xterm.js Isolation**: `term.writeln()` pushes strings to a canvas/grid renderer. It parses ANSI color codes but treats HTML tags as literal text, providing structural immunity to standard DOM XSS.
- **CSP Strictness**: The Manifest V3 directive `"extension_pages": "script-src 'self'; object-src 'self'"` is enforced. This hard-blocks inline scripting and remote execution payloads.
- **DOM Sanitization**: For reactive UI components (e.g., Modals, Tab Titles), the extension uses the industry-standard **DOMPurify**. It is bundled locally (`lib/dompurify.min.js`) to prevent supply chain attacks while ensuring enterprise-grade protection against mXSS (Mutation XSS) and namespace confusion vulnerabilities.

## 3. Privilege Escalation Simulation (Sudo Gate)

Commands that alter the browser's state or privacy context (e.g., `flush` for clearing cookies, `tabs -close`) are shielded by an internal privilege gate.

> **🛡️ Implementation Note**
> The `sudo` system is an **UX Architectural Construct**, not an OS-level root escalation. The extension operates with the permissions granted by the user at installation. The Sudo Gate acts as an intentional friction layer (middleware) to prevent accidental execution of destructive commands by requiring explicit user intent (prepending `sudo`).

## 4. Supply Chain Integrity

- **Zero External CDNs**: All runtime dependencies (such as `xterm.js` and `xterm-addon-fit.js`) are bundled internally within the extension package.
- **No 3rd-Party APIs**: The extension does not rely on proprietary, gated third-party APIs (e.g., VirusTotal, Wappalyzer API). It relies entirely on open infrastructure (RDAP, DoH) to prevent API key leakage or vendor lock-in.

[⬅ Return to Home](../../README.md)
