# Our Security & Privacy Promise 🔒

We built **WhatHappened** to be a tool you can trust. In a world of tracking and data harvesting, we wanted to create something that does the exact opposite. 

## How we keep you safe

### 1. Zero-Cloud Policy
This is our core rule: **Your data never leaves your browser.** 
- There are no backend servers. 
- There is no database. 
- There is no analytics or tracking scripts "phoning home."
- Everything you see in the terminal is processed right there on your machine.

### 2. Neutral by Design
We don't have favorites. The terminal doesn't promote any specific hosting company or registrar. We use a **Heuristic Discovery Engine**, which means we look at the live data (DNS, RDAP, CNAMEs) and tell you exactly what it says. If a site is hosted on Amazon, we say Amazon. If it's on a small local provider, we show that too.

### 3. Smart Data Handling
When you run a command like `email` or `dig`, we do have to talk to the internet to get the answers, but we do it very carefully:
- **Public Infrastructure Only**: We use standard, trusted APIs like Google's DNS-over-HTTPS and the global RDAP registry.
- **Privacy-First Requests**: We never send your cookies, private headers, or anything that identifies *you* to these services. We only send the domain name you're asking about.
- **Local Normalization**: When we need to figure out who owns a domain, we strip subdomains (like `www.`) locally before asking the registry. This keeps your specific browsing habits even more private.

### 4. No Third-Party Dependencies
We don't load libraries from external CDNs. All the code that makes the terminal work (like xterm.js) is bundled directly inside the extension. This prevents "Supply Chain" attacks and ensures the code you're running is exactly what we wrote.

## Reporting a Bug 🐛

If you find a security issue or a way we can improve our privacy, we want to hear about it!

Please **open a private issue** on this repository or reach out to the maintainer. We promise to get back to you within 48 hours and work on a fix as fast as humanly possible (usually within a week for critical stuff).

## Permission Breakdown

We only ask for what we absolutely need to make the tool work:
- **activeTab / tabs**: To know which site you want to audit.
- **storage**: To save your terminal history and settings on your computer.
- **scripting**: To read performance data or check for tracking pixels on the page you're currently looking at.
- **host_permissions**: To talk to the DNS/RDAP servers and check headers on the sites you choose to audit.

---

**Bottom line:** We built this for ourselves, and we use it every day. We wouldn't put anything in here that we wouldn't trust with our own data.
