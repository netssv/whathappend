# Permissions Scope

We follow the **Principle of Least Privilege** (Manifest V3).

## Required Permissions

| Permission | Why It's Needed |
|---|---|
| `activeTab` | Identify which site the user wants to audit. |
| `tabs` | Tab manager, watcher lifecycle, and scoping diagnostics to specific tabs. |
| `sidePanel` | The extension's entire UI is delivered as a side panel terminal. |
| `storage` | Save terminal history, user preferences, and geo bookmarks locally. No sync. |
| `scripting` | Read-only DOM extraction for performance metrics, pixel detection, and content auditing. |
| `cookies` | Audit cookie security flags (HttpOnly, Secure, SameSite) for user-specified domains. Read-only. |
| `browsingData` | The `flush` command clears cookies and cache scoped to a single origin, with modal confirmation. |
| `contentSettings` | The `tabs block` command toggles JavaScript, images, and popups per-domain for testing. |

## Optional Permissions (Granted On-Demand)

| Permission | Why It's Needed |
|---|---|
| `debugger` | Network throttling (`throttle`) and URL blocking (`block`) via Chrome DevTools Protocol. Only `Network.enable`, `Network.emulateNetworkConditions`, `Network.setBlockedURLs`, `attach`, and `detach` are used. Requested at runtime — the user is prompted before access is granted. |

## Removed in v2.8.1

| Permission | Reason for Removal |
|---|---|
| `clipboardRead` | Unnecessary in MV3 — `navigator.clipboard` works from extension pages without this permission. |
| `notifications` | Replaced by in-terminal visual/audio alerts (alarm chime + flash + title flash). |

## Host Permissions

We need broad host access because users audit **arbitrary domains** via commands like `curl`, `ssl`, `ping`, and `trace`. We cannot predict which domains will be analyzed.

| Pattern | Purpose |
|---|---|
| `https://dns.google/*` | DNS-over-HTTPS resolution |
| `https://rdap.org/*` | WHOIS/RDAP domain lookups |
| `https://crt.sh/*` | Certificate transparency log queries |
| `https://isitdown.site/*` | Domain uptime checking |
| `https://*/*` | User-initiated diagnostics (curl, ssl, ping, trace, speedtest) |
| `http://*/*` | HTTP fallback for isup checks |

### Security Guarantees

- All fetch requests are **diagnostic GET/HEAD** — no user data is transmitted.
- **Zero-cloud policy**: No backend, no analytics, no telemetry.
- **Strict CSP**: `script-src 'self'; object-src 'self'` — no remote code.
- All libraries (xterm.js) are **bundled locally** to prevent supply chain attacks.

[⬅ Return to Home](../../README.md)
