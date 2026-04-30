# WhatHappened

**The terminal you always wanted in your browser side panel.**

Ever find yourself jumping between 10 different tabs just to check a DNS record, see why an SSL certificate is acting up, or figure out who is actually hosting a site? We were tired of that too. So we built **WhatHappened**.

It’s a simple, powerful terminal that lives right in your Chrome side panel. It tells you exactly what’s going on under the hood of any website you’re visiting—without the clutter, without the tracking, and without the headaches.

## Why you'll love it

- **Context Aware**: Open the side panel, and it already knows what domain you're looking at. Just hit Enter to start a quick audit.
- **Human-Friendly**: We don't just dump raw data. We translate complex infrastructure into plain English so you actually understand the results.
- **Privacy First**: Everything runs locally in your browser. No servers, no databases, no tracking. Your data stays yours.
- **Real-Time Data**: We don't use stale static databases. We query live infrastructure (DNS, RDAP) in real-time to give you the most accurate "ground truth."

## Quick Start

The fastest way to get an answer is to open the side panel and:

1. **Press Enter** — The terminal automatically detects the site you're on and runs a quick check on the Registrar, NameServers, and Web Host.
2. **Type `go`** — Same as above, but for when you want to be explicit.
3. **Type `google.com`** — To set a new target. It will load the header info silently in the background while you keep working.

### Try these commands:
```text
 email google.com # Is their email security (SPF, DMARC, DKIM) set up right?
 sec github.com # Check SSL health and those pesky security headers.
 seo example.com # Run a baseline SEO audit (Title, Meta, H1).
 socials example.com # Extract social media presence and links.
 waf example.com # Detect WAFs (Cloudflare, Akamai, etc.).
 help # See the full list of what you can do.
```

---

## What’s New in v2.5.0?

We’ve turned the terminal into a professional-grade auditing suite:

- **Marketing & SEO Suite**: New commands to audit your web presence: `seo` (Baseline audit), `og` (Social cards), `alt` (Accessibility), and `socials`.
- **Security Infrastructure Triage**: Go deep with `csp` (Policy analyzer), `waf` (Firewall detection), `hsts` (Strict transport), and `headers-check`.
- **Developer Utilities**: Compare domains with `diff`, validate `schema` (JSON-LD), and check asset `minify` status.
- **Intelligent Auto-Hide**: The infrastructure header now intelligently fades out after a delay to save space, but briefly "pings" back whenever you type a command.
- **Hard Reboot**: Use `reload` to instantly flush memory and restart the extension context.
- **100% English Diagnostics**: Completed the transition to a unified, professional English-only engine.

---

## Our Privacy Promise

We take your privacy seriously because we’re users too.

- **Zero Cloud**: We don't have a backend. Your browser does 100% of the work.
- **No Third-Party Tracking**: We use standard public infrastructure like Google's DNS or the RDAP registry. We never send your cookies or identifying data to them.
- **Bundled & Secure**: We don't load scripts from CDNs. Everything is self-contained inside the extension for maximum security.

## Under the Hood

WhatHappened is a strict **Manifest V3** extension built for performance and reliability:
- **xterm.js**: For that authentic, high-performance terminal feel.
- **Atomic Architecture**: Our modules are strictly organized and kept under 200 lines to ensure the code stays fast and bug-free.
- **Heuristic Engine**: We don't rely on hardcoded "provider lists." We analyze live CNAME chains and IP data to figure out infrastructure on the fly.

---

## Contributing & License

Feel free to poke around the code or open an issue if you find something broken. We're always looking to make it better!

**License:** MIT (Go wild!)
