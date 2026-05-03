# RECON & Security Commands

OSINT, DOM extractors, and Security Scanners.

| Command | Description | Aliases |
|---------|-------------|---------|
| `email` | Checks MX, SPF, DMARC, and performs a heuristic DKIM discovery. | `mail` |
| `web` | Runs DNS, HTTP Headers, and SSL certificate checks simultaneously. | - |
| `audit` | Runs the Marketing Suite (SEO, OpenGraph, Alt tags, and Schema). | `marketing` |
| `sec` | Generates a security scorecard based on Headers and SSL/TLS configuration. | `scan`, `security` |
| `csp` | Analyzes Content-Security-Policy header for XSS vulnerabilities. | `xss` |
| `waf` | Detection of Web Application Firewalls (Cloudflare, Akamai, etc.). | `firewall` |
| `hsts` | Verification of HTTP Strict Transport Security policies. | `strict` |
| `headers-check` | Batch audit of all security-related HTTP response headers. | `hcheck` |
| `robots` | Fetches and displays `robots.txt`. | `sitemap` |
| `links` | Scans the active tab's DOM for mixed content (HTTP links on HTTPS). | `src` |
| `pixels` | Scans the active tab for known ad/tracking pixels. | `tracking`, `ads` |
| `malware`| Client-side heuristic scanner for malicious patterns in the DOM. | `virus`, `heuristics` |
| `socials`| Detects social media presence (scans active tab or static HTML). | `social` |
| `emails` | Scans the active tab for mailto: links and plaintext emails. | `contacts` |
| `phones` | Scans the active tab for tel: links and phone numbers. | `numbers` |
| `comments`| Scans the DOM for hidden HTML/JS developer comments. | `hidden`, `memo` |
| `seo` | Baseline SEO audit (Title, Meta Description, H1-H6 structure). | `meta`, `tags` |
| `og` | Open Graph & Social Cards audit (`og:image`, `twitter:card`). | `thaks`, `opengraph` |
| `alt` | Image accessibility scanner (missing `alt` tags). | `images`, `a11y` |
| `schema` | Structured Data scanner (JSON-LD, Microdata). | `jsonld` |
| `minify` | Checks if JS/CSS assets are properly minified. | `min` |
| `fonts` | Extracts typography and font-families used in the active tab. | `typography` |
| `palette`| Extracts the dominant color palette from the active tab. | `colors`, `theme` |
| `security-txt`| RFC 9116 security contact discovery (`/.well-known/security.txt`). | `sec-txt` |

[⬅ Return to Knowledge Map](../../map.md)
