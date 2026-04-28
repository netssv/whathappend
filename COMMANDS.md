# WhatHappened: Command Reference

This is a comprehensive guide to all the commands available in the WhatHappened terminal. 

**Pro-Tip:** If you ever forget how a command works, just type `?` after it in the terminal (e.g. `email?` or `dig?`) for a detailed breakdown and examples.

---

## Audits (The Heavy Hitters)
These commands bundle multiple checks together to give you a comprehensive overview of a specific area.

| Command | Description | Aliases |
|---------|-------------|---------|
| `email` | Checks MX, SPF, DMARC, and performs a heuristic DKIM discovery. | `mail` |
| `web` | Runs DNS, HTTP Headers, and SSL certificate checks simultaneously. | `audit` |
| `sec` | Generates a security scorecard based on Headers and SSL/TLS configuration. | `scan`, `security` |

---

## DNS & Network
Native DNS queries using Google's DNS-over-HTTPS.

| Command | Description | Aliases |
|---------|-------------|---------|
| `dig` | Full DNS lookup. Append record types or `+short` (e.g. `dig mx +short`). | `dns`, `record` |
| `host` | Quick summary of A, AAAA, and MX records. | - |
| `nslookup` | Name server lookup for the domain. | `lookup` |
| `ttl` | Extracts and displays the Time-To-Live (TTL) for all DNS records. | - |
| `dnssec` | Validates DNSSEC zone authorization. | - |
| `rev-dns` | Reverse DNS (PTR) lookup for an IP address. | `rdns`, `ptr` |
| `port-scan` | Lightweight port scanner for common services (80, 443, 21, 22, etc.). | `ports`, `nmap` |
| `ftp-check` | Grabs the FTP banner if port 21 is open. | `ftp` |

### DNS Shortcuts
Type these directly to get specific records:
`a`, `aaaa`, `mx`, `txt`, `ns`, `cname`, `soa`

---

## ️ Web & Infrastructure
Dig into the architecture, hosting, and performance of a site.

| Command | Description | Aliases |
|---------|-------------|---------|
| `whois` | Domain WHOIS registration data. | `domain` |
| `registrar` | Domain lifecycle (Registrar, Created, Expiry dates, Days remaining). | `reg`, `lifecycle` |
| `hosting` | Identifies the actual IP hosting provider (AWS, Cloudflare, etc.). | `provider`, `webhost` |
| `ip` | Shows your public IP (no args) or resolves a domain's A record/provider. | `myip`, `public-ip` |
| `isup` | Compares local reachability vs Google's global DNS to check for downtime. | `upcheck`, `down` |
| `speed` | Latency jitter test (performs 5 sequential HEAD requests). | `jitter` |
| `speedtest` | Local bandwidth test to Cloudflare's speed endpoint. | `bandwidth` |
| `curl` | Fetches and displays HTTP headers. | `http`, `headers` |
| `openssl` | Inspects the SSL/TLS certificate chain. | `ssl`, `cert`, `tls` |
| `stack` | Fingerprints the technology stack (CMS, frameworks, server). | `tech`, `cms` |
| `vitals` | Core Web Vitals scorecard (LCP, CLS, INP) directly from the browser. | `cwv`, `web-vitals` |

---

## ️ OSINT & Content
Gather public intelligence and historical data.

| Command | Description | Aliases |
|---------|-------------|---------|
| `history` | Certificate Transparency logs (finds the true creation date of a site). | `crt` |
| `wayback` | Archive.org timeline (when was this content last seen online?). | `archive` |
| `robots` | Fetches and displays `robots.txt`. | `sitemap` |
| `links` | Scans the active tab's DOM for mixed content (HTTP links on HTTPS). | `src` |
| `pixels` | Scans the active tab for known ad/tracking pixels. | `tracking`, `ads` |
| `green` | Checks if the hosting provider runs on green/renewable energy. | - |
| `cookies` | Privacy audit of cookies set by the domain. | - |
| `security-txt`| RFC 9116 security contact discovery (`/.well-known/security.txt`). | `sec-txt` |

---

## External Tools
Generates safe, clickable links to industry-standard diagnostic tools. We never send your data to them directly.

| Command | Description | Aliases |
|---------|-------------|---------|
| `blacklist` | MXToolbox blacklist lookup. | `bl`, `rbl` |
| `ssllabs` | Qualys SSL Labs deep scan. | `ssltest` |
| `securityheaders` | Scott Helme's Header Grade (A+ to F). | `sheaders` |
| `whois-ext` | ICANN / DomainTools lookup. | `icann` |

---

## ️ Terminal Utilities
Control the terminal environment itself.

| Command | Description | Aliases |
|---------|-------------|---------|
| `start` | Analyzes the active tab (implicitly runs with `-go` flag). | `run`, `go`, `begin` |
| `target` | Sets the target domain silently. | - |
| `tabs` | List, close, sleep, or inspect tabs. `diag` scans for health issues. | `tab`, `close`, `info`, `diag`, `sleep` |
| `config` | View or change user preferences (`config timeout 5000`). | `settings`, `set` |
| `export` | Saves the entire session output as a JSON file. | `dump`, `save` |
| `flush` | Clears cookies and cache for a specific domain. | `clearcache` |
| `notes` | Add session annotations (included in JSON export). | `note`, `memo` |
| `info` | System diagnostics (telemetry, versions, browser details). | `status` |
| `about` | Philosophy, identity, and architecture. | - |
| `clear` | Clears the terminal screen. | `cls`, `reset` |
| `exit` | Ends the session, clears history, and closes out. | `quit` |
| `help` | Shows the quick-reference menu in the terminal. | `?`, `ls`, `man` |
