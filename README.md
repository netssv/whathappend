# WhatHappened

A terminal in your Chrome side panel to debug web infrastructure (DNS, SSL, HTTP headers, emails).

We built this because we were tired of jumping between 10 different web tools just to check a DNS record or see why an SSL cert is failing. 

## How it works

Open the side panel, and the terminal automatically picks up the domain you're currently looking at. Type a command, get the data.

```text
> email google.com        # Checks MX, SPF, DMARC, DKIM
> dig example.com MX      # Standard DNS lookup
> sec github.com          # Checks SSL and security headers
> registrar example.com   # Registrar, created, expiry dates
> hosting example.com     # Who's hosting this site?
```

Everything runs locally in your browser. We don't have servers, we don't have a database, and we don't track you. 

When a command needs network data, the extension's Service Worker uses standard public web APIs (like Google's DNS-over-HTTPS or the RDAP registry). The data comes straight from them to your browser.

## What's new in v2.1.0

- **Humanized Commands**: `registrar` for domain lifecycle (registrar, creation, expiry, days remaining) and `hosting` for instant IP-to-provider mapping — both backed by live RDAP.
- **Heuristic DKIM Discovery**: The DKIM scanner now infers selectors dynamically from MX and SPF records. If your mail routes through a known infrastructure, the engine automatically tests the right selectors — no static databases needed.
- **Async Triage**: The auto-analysis flow now uses `Promise.allSettled()` for resilience. A single slow or failed API call won't take down the whole triage.
- **Command Firewall**: Terminal buffer security prevents automated diagnostic output from being misinterpreted as user commands.

## What's new in v2.1.1

- **True Async Triage**: Fixed a race condition where the Domain Delegation block printed `(searching...)` placeholders that got stuck in terminal history. The delegation block now waits for **all** data to resolve before rendering, showing `N/A` for genuinely unresolvable fields. If network takes longer than 2.5 seconds, a latency warning is displayed.
- **Autocomplete Fix**: The Tab completion engine now includes `registrar`, `hosting`, and all their aliases. Typing `re` + Tab correctly suggests `registrar`, `rev-dns`, `redirect`, etc.
- **Input Sanitizer**: Trailing backslashes (e.g. `marcharwitz.com\`) no longer cause "Unknown command" errors. Both the input preprocessor and engine entry point now strip trailing `\` characters.

## No Third-Party Dependencies

This extension is completely self-contained to keep your data secure:
- No external CDNs (all libraries like xterm.js are bundled locally).
- No remote code execution.
- No analytics or tracking scripts.

### External Links & Credibility

We do provide some commands that generate links to external diagnostic tools. We do this because sometimes you need a deeper, server-side scan that a browser simply can't do. 

We only link to highly credible, industry-standard tools. We **never** send your data to them in the background; we just build the URL so you can explicitly click it if you want to.

* **Qualys SSL Labs** (`ssllabs` command): [https://www.ssllabs.com](https://www.ssllabs.com) - The absolute gold standard for deep SSL/TLS auditing.
* **SecurityHeaders** (`securityheaders` command): [https://securityheaders.com](https://securityheaders.com) - Created by security researcher Scott Helme, the standard for HTTP header checks.
* **MXToolbox** (`blacklist` command): [https://mxtoolbox.com](https://mxtoolbox.com) - The most reliable and widely used tool for email routing and blacklist diagnostics.
* **IntoDNS** (DNS reporting): [https://intodns.com](https://intodns.com) - Excellent for checking DNS delegation and glue records.

## Commands

| Category | Commands | What it does |
|----------|----------|-------------|
| **Audits** | `email` `web` `sec` | Runs a bunch of checks at once and gives you the highlights. |
| **DNS** | `dig` `host` `nslookup` `a` `aaaa` `mx` `txt` `ns` `cname` `soa` `ttl` | Native DNS queries (via Google DoH). |
| **Email** | `spf` `dmarc` `dkim` | Email security checks (includes heuristic DKIM selector inference from MX/SPF). |
| **Web** | `curl` `openssl` `whois` `registrar` `hosting` `ping` `trace` `robots` | HTTP requests, certs, lifecycle, hosting, and routing. |
| **Analysis** | `pixels` `load` `stack` | Tracking pixel detection (Live DOM memory scanning), page load performance, and tech stack fingerprinting. |
| **External** | `blacklist` `ssllabs` `securityheaders` `whois-ext` | Generates safe, clickable links to the credible tools mentioned above. |

*(Type `help` in the terminal for the full list, or append `?` to a command like `email?` for details).*

## Architecture

This is a strict Manifest V3 extension. 
- `terminal.html` runs the UI.
- `background.js` (Service Worker) handles the network requests to bypass CORS safely.

```text
Chrome Extension 
 ├── terminal.js (xterm) 
 │    └── modules/engine.js (routes your commands)
 └── background.js (Service Worker)
      ├── dns.google (DNS lookups)
      ├── rdap.org (WHOIS + IP owner detection)
      └── chrome.scripting (Live DOM scan, Performance API)
```

All provider detection (IP owners, NS operators, registrars) is **100% dynamic** via RDAP. There are no static IP databases to maintain — the extension queries the global RDAP registry in real-time. DKIM selector discovery is also purely dynamic (via MX/SPF heuristic inference) to eliminate static dependencies. The architecture is intentionally **provider-agnostic** — no vendor names are hardcoded in output or insights.

### Permissions we ask for (and why)

- `activeTab` & `tabs`: So we know what website you're currently looking at to set the default target.
- `sidePanel`: Because the terminal lives there.
- `storage`: To save your terminal history and preferences locally.
- `scripting`: To read live DOM content and Performance API timing data from the active tab (for `pixels` and `load` commands).
- `host_permissions`: We need access to `https://dns.google/*`, `https://rdap.org/*`, and `https://crt.sh/*` to run the diagnostic queries. We also ask for general `http://*/*` and `https://*/*` to fetch headers from the sites you are auditing.

## Keyboard Shortcuts

- `Ctrl+C`: Cancel / clear line
- `Ctrl+L`: Clear screen
- `Tab`: Auto-complete / fill active domain
- `Up` / `Down`: History navigation

## Raw TCP Connections (Port Scanning)

Browsers cannot perform raw TCP connections. Because of this, commands like `port-scan` or `ftp-check` are fundamentally limited inside a Chrome extension. 

We **do not** ask you to install native host scripts or third-party binaries on your machine to bypass this. If you need deep port scanning or FTP banner grabbing, we recommend using dedicated local tools (like `nmap`) or the credible external web services linked in our terminal.

## License

MIT
