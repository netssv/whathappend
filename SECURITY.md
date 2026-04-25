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
| `crt.sh` / `certspotter.com` | Certificate Transparency Logs | The domain you are querying |
| `archive.org` | Wayback Machine API | The domain you are querying |
| `api.thegreenwebfoundation.org` | Environmental hosting check | The domain you are querying |
| `ip-api.com` | Geolocation and routing data | The IP address you are querying |
| User-specified URLs | HTTP header inspection, ping, trace | The URL you typed into the terminal |
| `chrome.scripting` (local) | Live DOM scan, Performance API | No data sent — reads from the active tab locally |

No background requests are made without user action. No data is cached on remote servers.

### Third-Party API Privacy

All requests to third-party APIs (`dns.google`, `rdap.org`, `crt.sh`, `api.certspotter.com`, `archive.org`, `api.thegreenwebfoundation.org`, `ip-api.com`) are executed securely via the background Service Worker as read-only queries. We strictly enforce a policy where **no cookies, private HTTP headers, or authentication tokens are ever sent** to these external sources. The only data transmitted is the explicit domain or IP you are querying.

## Terminal Buffer Security (Command Firewall)

The terminal implements a buffer integrity mechanism (`isSystemWriting`) that prevents automated diagnostic output from being misinterpreted as user-entered commands. When the system is rendering output (e.g., DKIM selector results containing domain strings), keyboard events are dropped entirely to prevent echo injection.

## External Links

Some commands generate clickable links to third-party diagnostic tools (Qualys SSL Labs, MXToolbox, SecurityHeaders). These links are **constructed locally** — we do not send your data to these services. You choose whether to click them.

## Apex Domain Resolution (Local Privacy)

When a subdomain is targeted (e.g., `www.facebook.com` or `courriel.easyhosting.com`), WhatHappened's `toApex()` normalizer extracts the apex (registered) domain (`facebook.com`, `easyhosting.com`) before querying RDAP for WHOIS data. This resolution is performed **entirely locally** using a deterministic suffix-matching algorithm with an embedded ccTLD list (e.g., `co.uk`, `com.br`, `gob.sv`).

- **No external Public Suffix List (PSL)** service is consulted.
- **No DNS queries** are made to determine the apex domain.
- **No subdomain data is transmitted** to RDAP servers — only the apex domain is sent.
- The ccTLD list is static and embedded in the extension source code (`formatter.js`), ensuring offline reliability and zero network exposure.

This design ensures that subdomain structure is never leaked to external services during the domain extraction step.

## Terminal Write Integrity

The progressive triage engine uses ANSI escape sequences to update skeleton rows in-place. A write-lock mechanism (`write-lock.js`) serializes terminal writes during cursor manipulation to prevent buffer corruption. This is a defense-in-depth measure — it prevents accidental command injection from interleaved I/O during automated output.

## DNS Record Privacy

DNS record lookups (A, AAAA, MX, NS, TXT, CNAME, SOA) are performed through Chrome's DNS-over-HTTPS resolver via the background service worker. WhatHappened:

- **Does not correlate** DNS results across domains or sessions.
- **Does not store** DNS responses beyond the current session's command history.
- **Does not perform** cross-domain inference — each lookup is independent and scoped to the user's explicit target.
- DNS data is used solely for display in the terminal output and is discarded when the side panel closes.

## Heuristic Infrastructure Mapping

The `infrastructure-map.js` module contains a static corporate affiliation database (e.g., "Cloudflare" → cloudflare group, "Incapsula" → imperva group). This data is:

- **Embedded locally** in the extension source code — no external API is queried.
- **Read-only** — the map is never modified at runtime.
- **Non-identifying** — it maps provider names to corporate groups, not user data to providers. No personally identifiable information is processed or correlated.

## Local Telemetry & Diagnostics

The \`info\` command collects session diagnostics (such as command execution count and browser engine metadata) for display within the terminal.
- **Strictly Local**: This telemetry is calculated on-the-fly and resides entirely in memory.
- **Zero Exfiltration**: No telemetry, analytics, or session data is ever transmitted to a remote server. When the session ends, the diagnostic counters are destroyed.

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
