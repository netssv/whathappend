# DNS & Network Commands

Native DNS queries using Google's DNS-over-HTTPS.

| Command | Description | Aliases |
|---------|-------------|---------|
| `dig` | Full DNS lookup. Append record types or `+short` (e.g. `dig mx +short`). | `dns`, `record` |
| `host` | Quick summary of A, AAAA, and MX records. | - |
| `nslookup` | Name server lookup for the domain. | `lookup` |
| `map` | Visual ASCII representation of the domain resolution journey. | `journey`, `flow` |
| `ttl` | Extracts and displays the Time-To-Live (TTL) for all DNS records. | - |
| `dnssec` | Validates DNSSEC zone authorization. | - |
| `rev-dns` | Reverse DNS (PTR) lookup for an IP address. | `rdns`, `ptr` |
| `port-scan` | Lightweight port scanner for common services (80, 443, 21, 22, etc.). | `ports`, `nmap` |
| `ftp-check` | Grabs the FTP banner if port 21 is open. | `ftp` |
| `isup` | Compares local reachability vs Google's global DNS to check for downtime. | `upcheck`, `down` |
| `jitter` | Latency jitter test (performs 5 sequential HEAD requests). | `latency-test` |
| `speedtest` | Local bandwidth test to Cloudflare's speed endpoint. | `bandwidth` |
| `watch` | Live network waterfall for the active tab. Shows resource timing bars, type labels, and sizes. Use `watch raw` for a compact dashboard. | `monitor`, `live`, `netwatch`, `waterfall` |

### DNS Shortcuts

Type these directly to get specific records:
`a`, `aaaa`, `mx`, `txt`, `ns`, `cname`, `soa`

[⬅ Return to Home](../../README.md)
