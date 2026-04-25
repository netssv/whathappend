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

## What's new in v2.2.0: Heuristic Apex Resolution & Async Triage

- **Heuristic Apex Resolution**: A new `toApex()` normalizer automatically strips subdomains before RDAP queries. `www.facebook.com` → `facebook.com`, `courriel.easyhosting.com` → `easyhosting.com`. The delegation table shows `Registrar ━ Meta Platforms, Inc. (facebook.com)` when the target differs from the apex domain. All extraction is performed locally — no external PSL service is consulted.
- **Per-Row Timeouts**: Each delegation row (Registrar, NameSrvs, Web Host) has a 4-second timeout safety net. If a network request doesn't settle in time, the row transitions from `⏳ loading...` to `[TIMEOUT]` instead of hanging indefinitely, allowing the stack summary (`↳ Distributed Stack`) to render immediately.
- **Terminal Write-Lock**: A mutex-style queue prevents cursor corruption when the progressive renderer updates skeleton rows while the user is typing. Each ANSI cursor manipulation is atomic — user keystrokes are buffered for microseconds, not blocked for the entire triage.
- **Progressive Triage Engine**: The auto-analysis skeleton renders immediately with `⏳ loading...` placeholders that update in-place as each data source resolves. Network latency no longer affects terminal availability.
- **Interactive Background Triage**: If the initial triage takes longer than 1.5 seconds, the terminal unlocks with a `[INFO] Background triage active` banner, allowing you to start typing commands immediately.

## What's new in v2.2.1: Latency Resilience

- **Cursor Positioning Fix**: Replaced `buf.cursorY + buf.baseY` absolute positioning (stale due to xterm.js async write batching) with a **relative offset counter** that tracks skeleton geometry deterministically. Rows now overwrite in-place reliably regardless of terminal scroll state.
- **Per-Row Isolation**: Each delegation row (Registrar, NameSrvs, Web Host) resolves in its own `async` function with a dedicated `try/catch` and 3.5-second timeout. A timeout or error in one row transitions it to `[N/A]` independently — the other rows continue resolving.
- **Insights Gatekeeper**: The `↳ Distributed Stack` / `↳ Consolidated Stack` summary only renders when **≥2 rows have confirmed values**. No more premature "Distributed Stack" appearing while rows are still loading.
- **DNS Exception for Subdomains**: WHOIS queries use the apex domain (`www.facebook.com` → `facebook.com`), but A/NS record lookups preserve the original subdomain since IP resolution may differ between `www.` and the apex.

## What's new in v2.2.2: Fixed ANSI Overwrite Ghosting & Infrastructure Correlation

- **Render Queue**: Row updates are now batched via `setTimeout(0)` and flushed as a single atomic terminal write. Multiple `.then()` callbacks firing in rapid succession are deduplicated by delta, eliminating duplicate "ghost" lines.
- **Infrastructure Correlation**: The `↳ Consolidated Stack` / `↳ Distributed Stack` insight now uses a **corporate affiliation map** (`infrastructure-map.js`) that knows parent/subsidiary relationships (e.g., Hostopia + Internet Names For Business → both Deluxe Corporation → Consolidated). Exact string matching is used as fallback for unlisted providers.
- **Aggressive Domain Sanitization**: A new `sanitizeDomain()` function normalizes raw user input before the triage engine — stripping whitespace, trailing slashes, protocols, paths, and lowercasing. Domains like `samanthadean.com` no longer fail NS lookups.
- **Resilient NS Parser**: The nameserver response parser now accepts bare hostnames (without trailing `.`), preventing false negatives when DNS-over-HTTPS responses omit the trailing dot.

## What's new in v2.3.0: Heuristic Infrastructure Mapping (Release 3)

- **ANSI Row-Lock & Clear**: Reversed the clear sequence to `\x1b[2K\r` (erase-then-position) instead of `\r\x1b[2K` (position-then-erase). This eliminates "ghost" remnants on high-latency RDAP responses (e.g., Pinterest, elsalvador.com) where the old `⏳ loading...` text was briefly visible below the resolved value.
- **Expanded Infrastructure Map**: Added 15 new corporate groups including Cloudflare (NS + CDN + DNS), Incapsula/Imperva (WAF + reverse proxy), StackPath/MaxCDN, AWS CloudFront/EC2/S3, and major managed WordPress hosts (WP Engine, Kinsta, Flywheel). The map now covers 35+ corporate families with 100+ keyword matches.
- **Cloudflare/Incapsula Consolidation**: If NameSrvs is Cloudflare and Web Host is Cloudflare, the result is now correctly `↳ Consolidated Stack (cloudflare)`. Previously reported as Distributed. Same fix for Incapsula/Imperva security stacks.
- **RFC-Aware CNAME Insights**: When `cname` or `ttl` is run on an apex domain and returns no CNAME record, the insight now explains: `[INFO] Apex domains usually lack CNAMEs per RFC 1034 standards` — preventing user confusion about "missing" records.

## What's new in v2.3.1: System Diagnostics & Identity

- **Command `about`**: A stylized ASCII banner and philosophical manifesto detailing WhatHappened's core principles: Atomic Architecture, Zero-Cloud Privacy, and Heuristic Discovery Engine.
- **Command `info`**: A real-time telemetry dashboard showing extension version, native host connectivity status (Python Bridge), browser engine details, and local session stats.
- **Enhanced DKIM Discovery Engine**: Expanded inference rules covering major ESPs (SendGrid, Mailgun, SparkPost) and CRM platforms (Zendesk, Salesforce, HubSpot, Intercom) to capture dozens of additional dynamic selectors.

### Triage Temporal

We've introduced two complementary commands for historical investigation:
- **`history` (Network Infrastructure)**: Uses Certificate Transparency (CT) logs to trace the lifecycle of a domain's SSL certificates. It identifies the first and last infrastructure footprints to show when a domain actually became active.
- **`wayback` (Content Visibility)**: Uses the Archive.org API to find the last time the domain's *content* was publicly accessible. This is invaluable for Junior Analysts when triaging a site that currently resolves to an error page or a parked domain. If `wayback` shows the site was online 2 days ago, it often indicates a recent DNS migration, expired hosting, or WAF block rather than a permanently dead domain.

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
| **DNS** | `dig` `host` `nslookup` `a` `aaaa` `mx` `txt` `ns` `cname` `soa` `ttl` `dnssec` | Native DNS queries (via Google DoH) and DNSSEC validation. |
| **Email** | `spf` `dmarc` `dkim` | Email security checks (includes heuristic DKIM selector inference from MX/SPF). |
| **Web** | `curl` `openssl` `whois` `registrar` `hosting` `ping` `trace` `green` | HTTP requests, certs, lifecycle, hosting, routing, and environmental hosting checks. |
| **OSINT & Content** | `robots` `links` `history` `wayback` | Public information gathering (robots.txt, mixed content scans, cert transparency, archive timelines). |
| **Analysis** | `pixels` `load` `stack` `cookies` | Tracking pixel detection, page load performance, tech stack fingerprinting, and privacy cookie auditing. |
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
