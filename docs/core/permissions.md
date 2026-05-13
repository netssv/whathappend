# Permissions Scope & Manifest Justifications

**Document Status:** Production Baseline
**Scope:** Chrome Web Store Compliance & MV3 Constraints

## Executive Summary
This document outlines the strict adherence to the **Principle of Least Privilege** governing the WhatHappened extension. It maps every requested permission to a specific architectural capability, serving as a transparent audit trail for both users and Chrome Web Store reviewers.

---

## 1. Core API Permissions

| Permission | Architectural Justification | Target Scope |
| :--- | :--- | :--- |
| `activeTab` | Determines the active Execution Context (Target Domain) for context-sensitive commands (e.g., `ssl`, `dig` without arguments). | Current Tab |
| `sidePanel` | The entire Presentation Layer (TUI) is delivered via Chrome's Side Panel API. | Extension UI |
| `storage` | Provides persistence for ephemeral state (`chrome.storage.local`). Used solely for terminal history and local geo-bookmarks. **No sync.** | Local Disk |
| `tabs` | Required to map the lifecycle of the active tab to the terminal session, enabling cross-tab diagnostic switching (`tabs` command). | Browser Window |
| `alarms` | Used for periodic background tasks: tab-watch polling intervals and configurable auto-triage scheduling. Alarms are created on-demand and cleared when the feature is disabled. | Extension-Internal |

---

## 2. Deep Auditing Permissions (Read/Write)

To perform deep infrastructure triage, the extension requires access to standard Web APIs.

> **💡 Simple Explanation**
> To check if a website is secretly running malicious scripts, or if its cookies are insecure, the terminal needs "read access" to the code of the site you are looking at. If you use the `flush` command to wipe the site's data, we need "write access" to clear those cookies.

| Permission | Architectural Justification | Risk Profile |
| :--- | :--- | :--- |
| `scripting` | Enables read-only DOM extraction (via injected content scripts) to evaluate Performance Timings, ad-pixels, and HTML footprint. | Low (Read Only) |
| `cookies` | Required by the `cookies` command to audit security flags (`HttpOnly`, `Secure`, `SameSite`) for the target domain. | Medium (Read Only) |
| `browsingData` | Required by the `flush` command to surgically clear caches/cookies scoped to the target origin. | High (Destructive) |
| `contentSettings` | Required by the `block` command to toggle JavaScript/Images per-domain for resilience testing. Settings are **always scoped to an explicit origin pattern** (e.g., `{ primaryPattern: "https://target.example.com/*" }`). Global patterns are never used. | Medium (Scoped State Mutation) |

> **🛡️ Security Notes: Destructive Operations**
> Any permission that allows state mutation (like `browsingData` or `contentSettings`) is hard-gated behind the **Sudo Middleware**. The system explicitly blocks execution until the user manually elevates privileges (e.g., `sudo flush`), preventing accidental data loss.

---

## 3. Chrome DevTools Protocol (CDP)

| Permission | Status | Architectural Justification |
| :--- | :--- | :--- |
| `debugger` | **Optional (On-Demand)** | Enables network emulation (`throttle`) via CDP. Only invokes `Network.enable`, `Network.emulateNetworkConditions`, `attach`, and `detach`. |

> **⚠️ Scope Constraint:** The `debugger` permission grants access to the full Chrome DevTools Protocol surface. This extension invokes **only** the following CDP methods: `Debugger.attach`, `Debugger.detach`, `Network.enable`, `Network.emulateNetworkConditions`, `Network.disable`. No other CDP domains (`Runtime.evaluate`, `Page.navigate`, etc.) are invoked. This constraint is enforced by code review. The `debugger` session is attached on-demand when `throttle` is invoked and detached immediately upon `throttle reset`.

---

## 4. Host Permissions & Network Boundaries

To fulfill its role as a network diagnostic tool, WhatHappened requires broad host access (`<all_urls>`).

**Why broad host access is required:**
The tool executes user-defined, read-only diagnostic commands (such as `curl`, `ssl`, `ping`, `trace`) against **arbitrary user-specified domains**. The extension cannot predict which FQDN the operator will audit at install time. All requests are strictly GET/HEAD and do not transmit user session data or authentication tokens.

| Target Pattern | Protocol/Service | Architectural Purpose |
| :--- | :--- | :--- |
| `https://dns.google/*` | HTTPS (DoH) | Primary DNS resolution pipeline. |
| `https://rdap.org/*` | HTTPS (REST) | Global WHOIS/IP Provider lookups. |
| `https://crt.sh/*` | HTTPS (REST) | Certificate Transparency logs (Historical SSL). |
| `https://*/*` | HTTP/HTTPS | Standard targets for user-initiated `curl`/`ping`/`ssl` audits. |

### 🟠 CWS Risk Assessment (Broad Host Permissions)
Broad host permissions typically trigger manual review in the Chrome Web Store. To mitigate this:
1. All arbitrary fetch requests are strictly **GET/HEAD** passive inspections.
2. The extension never transmits user tokens, cookies, or session credentials in these diagnostic requests.
3. The codebase contains no backend telemetry mechanism. Audited domain names are never exfiltrated.
4. The extension's use case is passive infrastructure inspection, not active exploitation or automated scanning.

[⬅ Return to Home](../../README.md)
