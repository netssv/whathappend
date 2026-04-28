# WhatHappened 🕵️‍♂️

**The terminal you always wanted in your browser side panel.**

Ever find yourself jumping between 10 different tabs just to check a DNS record, see why an SSL certificate is acting up, or figure out who is actually hosting a site? We were tired of that too. So we built **WhatHappened**.

It’s a simple, powerful terminal that lives right in your Chrome side panel. It tells you exactly what’s going on under the hood of any website you’re visiting—without the clutter and without the tracking.

## Why you'll love it

- **Context Aware**: Open the side panel, and it already knows what domain you're looking at. Just hit Enter to start a quick audit.
- **Human-Friendly**: No more deciphering cryptic outputs. We translate complex infrastructure data into plain English.
- **Privacy First**: Everything runs locally in your browser. No servers, no databases, no tracking. Your data stays yours.
- **Zero Fluff**: We don't use static databases. We query live infrastructure (DNS, RDAP) in real-time to give you the most accurate "ground truth."

## Quick Start 🚀

The fastest way to get an answer is to open the side panel and:

1.  **Press Enter** — The terminal automatically detects the site you're on and runs a quick check on the Registrar, NameServers, and Web Host.
2.  **Type `go`** — Same as above, but for when you want to be explicit.
3.  **Type `go example.com`** — To audit a specific site without leaving the one you're on.

### Try these commands:
```text
❯ email google.com        # Is their email security (SPF, DMARC, DKIM) set up right?
❯ sec github.com          # Check SSL health and those pesky security headers.
❯ hosting example.com     # Who is actually running this site?
❯ vitals                  # How's the performance? (LCP, CLS, INP)
❯ help                    # See the full list of what you can do.
```

---

## What’s New in v2.4.0? 🎁

We’ve been busy making the terminal smarter and easier to use:

- **Silent Triage**: Now, when you set a target, it loads the header info quietly in the background. No more progress bars blocking your view unless you specifically ask for them with `-go`.
- **Command Chaining**: Want to set a target and scan it immediately? Try `google.com -vitals`. 
- **Smart Autocomplete**: Press `Tab` after typing a domain, and we'll suggest flags for you. It even suggests domains from your other open tabs!
- **New `ip` command**: Quickly see your own public IP or resolve a domain's A record and provider in one go.
- **Security.txt Support**: Use `security-txt` to find out how to responsibly report bugs to a site.
- **Notes**: Keep track of your thoughts during an audit with the `notes` command. They even get included if you export your session to JSON.

---

## Our Privacy Promise 🛡️

We take your privacy seriously because we’re users too.

- **No Third-Party APIs** that track you. We use standard public infrastructure like Google's DNS or the RDAP registry.
- **No Remote Processing**. Your browser does all the work.
- **No Dependencies**. We don't load scripts from external servers. Everything is bundled inside the extension.

## Architecture & Tech

WhatHappened is a strict **Manifest V3** extension. It uses:
- **xterm.js** for that authentic terminal feel.
- **DNS-over-HTTPS** for secure, private lookups.
- **RDAP** for real-time provider and registrar discovery.
- **Heuristic Discovery Engine**: We don't use "provider lists." We look at live CNAMEs and IP data to figure out the infrastructure on the fly.

---

## Contributing & License

Feel free to poke around the code or open an issue if you find something broken. 

**License:** MIT (Go wild!)
