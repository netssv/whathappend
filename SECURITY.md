# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in WhatHappened, please report it responsibly.

**Email:** Open a private issue on this repository or contact the maintainer directly.

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Neutral Build Architecture

WhatHappened is built on a **provider-agnostic** philosophy. The tool is designed to diagnose infrastructure objectively, without favoring, promoting, or disfavoring any specific hosting, DNS, email, or registrar provider.

### Design Principles

- **Zero Hardcoded Providers**: All provider detection (IP owners, nameserver operators, registrars, hosting companies) is resolved dynamically at runtime via RDAP queries. There are no static IP-to-provider databases, no vendor maps, and no branded logic paths.
- **Heuristic DKIM Discovery**: DKIM selectors are inferred from MX and SPF record patterns using generic token extraction — not from a static list of vendor-specific selectors.
- **Neutral Output**: Diagnostic insights reference providers only as they appear in live RDAP/DNS data. No editorial commentary or provider-specific recommendations are embedded in the output.
- **CNAME Chain Resolution**: The DKIM auditor follows CNAME chains (up to 3 levels) to extract the actual signing endpoint, regardless of which provider operates the delegation.

This architecture ensures the tool can be used in any environment — enterprise, agency, educational, or personal — without implicit vendor bias.

## Data Handling — Zero-Cloud Policy

WhatHappened follows a strict **Zero-Cloud** policy:

- **No data leaves your browser.** All diagnostic results are processed locally in the extension's Service Worker and Side Panel.
- **No telemetry, analytics, or tracking** of any kind.
- **No user accounts or authentication.** There is nothing to sign up for.
- **Terminal history** is stored exclusively in `chrome.storage.local` on your machine. It is never transmitted anywhere.
- **No remote processing.** There is no backend server. The extension does not upload, cache, or relay your queries through any intermediary.

## Network Access

The extension makes network requests **only** to the following public infrastructure APIs, and **only** when you explicitly run a command:

| Endpoint | Purpose | Data Sent |
|----------|---------|-----------|
| `dns.google` | DNS-over-HTTPS lookups | Domain name you are querying |
| `rdap.org` | WHOIS/RDAP registry data, IP owner detection | Domain or IP you are querying |
| User-specified URLs | HTTP header inspection, ping, trace | The URL you typed into the terminal |
| `chrome.scripting` (local) | Live DOM scan, Performance API | No data sent — reads from the active tab locally |

No background requests are made without user action. No data is cached on remote servers.

## Terminal Buffer Security (Command Firewall)

The terminal implements a buffer integrity mechanism (`isSystemWriting`) that prevents automated diagnostic output from being misinterpreted as user-entered commands. When the system is rendering output (e.g., DKIM selector results containing domain strings), keyboard events are dropped entirely to prevent echo injection.

## External Links

Some commands generate clickable links to third-party diagnostic tools (Qualys SSL Labs, MXToolbox, SecurityHeaders). These links are **constructed locally** — we do not send your data to these services. You choose whether to click them.

## Permissions

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` + `tabs` | To detect the domain of the website you are currently viewing, so the terminal can auto-target it. |
| `sidePanel` | The terminal UI lives in Chrome's Side Panel. |
| `storage` | To persist your terminal command history and font preferences locally. |
| `scripting` | To execute read-only scripts on the active tab for Live DOM scanning (`pixels`) and Performance API timing (`load`). No data is modified or transmitted. |
| `clipboardRead` | To support pasting text into the terminal. |
| `host_permissions` | To fetch HTTP headers, DNS data, and WHOIS information from the domains you are auditing. |

## Dependencies

WhatHappened has **zero runtime third-party dependencies**. All libraries (xterm.js, FitAddon, WebLinksAddon) are bundled locally in the `/lib/` directory. No CDN requests, no remote script loading.

## Content Security Policy

```
script-src 'self'; object-src 'self'
```

This is the strictest CSP allowed by Chrome Extensions, preventing any inline scripts or external code execution.
