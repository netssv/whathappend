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

## Getting Started

When you open the side panel, you'll see a prompt. The fastest way to begin:

1. **Press Enter** — The terminal auto-detects the domain of the active browser tab and runs a full infrastructure triage (Registrar, NameServers, Web Host).
2. **Type `start`** — Same behavior. Works as an explicit command you can remember.
3. **Type `start example.com`** — Skip auto-detection and analyze a specific domain.

The `start` command (and its aliases `run`, `go`, `begin`) is the universal entry point for any audit. From there, you can drill deeper with specific commands like `email`, `sec`, or `dig`.

```text
❯ start                    # Analyze whatever tab you're looking at
❯ start shopify.com        # Analyze a specific domain
❯ email                    # Deep-dive: email security audit
❯ config                   # View/change preferences
```

Type `help` for the full command list, or append `?` to any command (e.g., `start?`, `email?`) for usage details.

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
- **Insights Gatekeeper**: The `↳ Managed by` provider summary only renders when **≥2 rows have confirmed values**. No more premature summaries appearing while rows are still loading.
- **DNS Exception for Subdomains**: WHOIS queries use the apex domain (`www.facebook.com` → `facebook.com`), but A/NS record lookups preserve the original subdomain since IP resolution may differ between `www.` and the apex.

## What's new in v2.2.2: Fixed ANSI Overwrite Ghosting & Infrastructure Correlation

- **Render Queue**: Row updates are now batched via `setTimeout(0)` and flushed as a single atomic terminal write. Multiple `.then()` callbacks firing in rapid succession are deduplicated by delta, eliminating duplicate "ghost" lines.
- **Infrastructure Correlation**: The `↳ Managed by` insight now uses dynamic heuristic resolution — provider identity is extracted from live CNAME records and RDAP responses at runtime, with no static vendor databases.
- **Aggressive Domain Sanitization**: A new `sanitizeDomain()` function normalizes raw user input before the triage engine — stripping whitespace, trailing slashes, protocols, paths, and lowercasing. Domains like `samanthadean.com` no longer fail NS lookups.
- **Resilient NS Parser**: The nameserver response parser now accepts bare hostnames (without trailing `.`), preventing false negatives when DNS-over-HTTPS responses omit the trailing dot.

## What's new in v2.3.0: Heuristic Infrastructure Mapping (Release 3)

- **ANSI Row-Lock & Clear**: Reversed the clear sequence to `\x1b[2K\r` (erase-then-position) instead of `\r\x1b[2K` (position-then-erase). This eliminates "ghost" remnants on high-latency RDAP responses (e.g., Pinterest, elsalvador.com) where the old `⏳ loading...` text was briefly visible below the resolved value.
- **Dynamic Provider Resolution**: Provider identification is now 100% heuristic — extracted from live CNAME records and RDAP responses at runtime with no static vendor databases.
- **RFC-Aware CNAME Insights**: When `cname` or `ttl` is run on an apex domain and returns no CNAME record, the insight now explains: `[INFO] Apex domains usually lack CNAMEs per RFC 1034 standards` — preventing user confusion about "missing" records.

## What's new in v2.3.1: System Diagnostics & Identity

- **Command `about`**: A stylized ASCII banner and philosophical manifesto detailing WhatHappened's core principles: Atomic Architecture, Zero-Cloud Privacy, and Heuristic Discovery Engine.
- **Command `info`**: A real-time telemetry dashboard showing extension version, native host connectivity status (Python Bridge), browser engine details, and local session stats.
- **Enhanced DKIM Discovery Engine**: Expanded inference rules covering major ESPs (SendGrid, Mailgun, SparkPost) and CRM platforms (Zendesk, Salesforce, HubSpot, Intercom) to capture dozens of additional dynamic selectors.

### Triage Temporal

We've introduced two complementary commands for historical investigation:
- **`history` (Network Infrastructure)**: Uses Certificate Transparency (CT) logs to trace the lifecycle of a domain's SSL certificates. It identifies the first and last infrastructure footprints to show when a domain actually became active.
- **`wayback` (Content Visibility)**: Uses the Archive.org API to find the last time the domain's *content* was publicly accessible. This is invaluable for Junior Analysts when triaging a site that currently resolves to an error page or a parked domain. If `wayback` shows the site was online 2 days ago, it often indicates a recent DNS migration, expired hosting, or WAF block rather than a permanently dead domain.

## What's new in v2.4.0: Professional Audit & New Command Suite

### New Commands

- **`ip`** (Dual Mode): Without arguments, shows your public IP and ISP via ipify.org + RDAP. With a domain argument, resolves the A record and identifies the hosting provider. Aliases: `myip`, `public-ip`.
- **`security-txt`**: Fetches and parses `/.well-known/security.txt` (RFC 9116) from the target domain. Displays Contact, Policy, Encryption, and Acknowledgments fields. Falls back to legacy `/security.txt` path. Aliases: `sec-txt`.
- **`vitals`**: Core Web Vitals scorecard — extracts LCP, CLS, and INP from the active tab via the Performance API. Each metric is graded against Google's thresholds (Good / Needs Improvement / Poor). Aliases: `cwv`, `web-vitals`.
- **`flush`**: Clears cookies and cache for a specific domain using `chrome.browsingData`. Requires explicit domain argument (no auto-target) as a safety mechanism. Aliases: `clearcache`.
- **`notes`**: Add analyst annotations to the current session. Notes persist via `chrome.storage.session` and are included in the JSON export. Aliases: `note`, `memo`.

### Refactors

- **Speedtest Fix**: Max payload capped at 90MB (was 100MB) to avoid Cloudflare 403 rate-limiting on large downloads.
- **History Bug Fix**: Fixed undefined variable reference (`${domain}` → `${t}`) in the certificate transparency insights.
- **Windows Display**: Viewport padding increased to 40px for maximum prompt visibility.

## What's new in v2.3.3: Windows Display Optimization & Dynamic Infrastructure Mapping

- **Windows Display Optimization**: Implemented a dynamic viewport padding system (`padding-bottom: 2rem`) to ensure the terminal prompt never clips or touches the bottom edge on Windows.
- **Auto-Scroll Integrity**: The progressive triage engine now forces an automatic scroll-to-bottom upon resolving every data row, guaranteeing visual continuity.
- **Dynamic Infrastructure Mapping**: Completely removed all static provider lists and corporate affiliation databases. The terminal now uses a 100% heuristic approach, extracting provider identity directly from live CNAME records (`[INFO] Managed by [Provider Domain]`) to maintain absolute vendor neutrality.
- **ITIL Status Announcements**: The `speedtest` command now points to a high-availability neutral endpoint and gracefully maps HTTP error codes to professional ITIL status announcements (e.g., `[NOTICE] Resource Limit: The test server is rate-limiting large requests (403)`).

## What's new in v2.3.2: Network Parity & User Preferences

### Network Parity

- **Command `isup`**: Compares local reachability against Google's global DNS-over-HTTPS infrastructure to determine if a site is globally down (unresolvable) or blocked only from your network. Outputs a side-by-side `Local Access` vs `Global Access` comparison with actionable insights (ISP routing, firewall, CDN edge-cache scenarios).
- **Command `speed`**: Performs 5 sequential HEAD requests and calculates average latency and jitter (standard deviation). A jitter σ > 50ms triggers a `[WARN] Unstable connection` insight. Useful for diagnosing congestion vs. server-side latency.

### User Preferences

- **`config expert-mode on/off`**: New toggle for raw technical data in diagnostic output (default: off).
- **`config list`**: Alias for viewing all current settings.
- **RDAP Entity Filter**: The triage engine now filters out RDAP maintainer references (`MNT-*`, `*-MNT`, `AS####`) that were incorrectly displayed as provider names.

### Header Retry UX

- **Click-to-Retry**: When a triad field (REG/NS/HOST) fails to resolve, it shows a pulsing amber `↻ retry` indicator. Clicking it triggers a fresh lookup with a spinning green animation.
- **Generation Counter**: Background retries are automatically cancelled when the user switches targets, preventing stale results from polluting the header.
- **Header Refactor**: `header-controller.js` decomposed into `header-domain.js`, `header-triad.js`, and `header-tab-switch.js` via a barrel re-export.

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
| **Util** | `start` `switch` `target` `config` `export` `exit` | Quick-start analysis, tab switching, preferences, session management. |

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
