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

## Data Handling

WhatHappened follows a strict **Zero-Cloud** policy:

- **No data leaves your browser.** All diagnostic results are processed locally in the extension's Service Worker and Side Panel.
- **No telemetry, analytics, or tracking** of any kind.
- **No user accounts or authentication.** There is nothing to sign up for.
- **Terminal history** is stored exclusively in `chrome.storage.local` on your machine. It is never transmitted anywhere.

## Network Access

The extension makes network requests **only** to the following public infrastructure APIs, and **only** when you explicitly run a command:

| Endpoint | Purpose | Data Sent |
|----------|---------|-----------|
| `dns.google` | DNS-over-HTTPS lookups | Domain name you are querying |
| `rdap.org` | WHOIS/RDAP registry data | Domain name you are querying |
| `api.certspotter.com` | Certificate Transparency logs | Domain name you are querying |
| User-specified URLs | HTTP header inspection, ping, trace | The URL you typed into the terminal |

No background requests are made without user action. No data is cached on remote servers.

## External Links

Some commands generate clickable links to third-party diagnostic tools (Qualys SSL Labs, MXToolbox, SecurityHeaders). These links are **constructed locally** — we do not send your data to these services. You choose whether to click them.

## Permissions

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` + `tabs` | To detect the domain of the website you are currently viewing, so the terminal can auto-target it. |
| `sidePanel` | The terminal UI lives in Chrome's Side Panel. |
| `storage` | To persist your terminal command history and font preferences locally. |
| `clipboardRead` | To support pasting text into the terminal. |
| `host_permissions` | To fetch HTTP headers, DNS data, and WHOIS information from the domains you are auditing. |

## Dependencies

WhatHappened has **zero runtime third-party dependencies**. All libraries (xterm.js, FitAddon, WebLinksAddon) are bundled locally in the `/lib/` directory. No CDN requests, no remote script loading.

## Content Security Policy

```
script-src 'self'; object-src 'self'
```

This is the strictest CSP allowed by Chrome Extensions, preventing any inline scripts or external code execution.
