# Threat Model (v3.1.x)

**Document Status:** Formal Audit Baseline
**Scope:** Browser Environment & Manifest V3 Context

This document outlines the security assumptions, key assets, threat actors, and attack vectors considered in the architecture of WhatHappened. This model ensures that security is explicitly maintained as the extension evolves.

---

## 💎 Assets (What we protect)

The extension handles diagnostic data in a highly privileged environment (the browser). The primary assets are:

1. **Terminal History:** Stored in `chrome.storage.local`. Contains previous commands, potentially including sensitive parameters or local paths/domains if entered by the user.
2. **Tab Metadata:** Active tab URLs, titles, and routing information. Used to automatically target diagnostics.
3. **Session Cookies:** The `cookies` command reads cookie flags (e.g., Secure, SameSite, HttpOnly) for auditing purposes. *This data is never stored.*
4. **Content Settings:** The `block` command modifies the browser's `contentSettings` state (e.g., blocking Javascript on a specific origin).

---

## 🦹 Threat Actors

We design defenses against the following potential adversaries:

1. **Malicious Website Operators:** An adversary controlling the HTTP response headers, WHOIS records, or DNS TXT records of a domain being audited. They attempt to inject malicious payloads into the diagnostic output.
2. **Compromised Supply Chain:** An attacker injecting malicious code into third-party dependencies (e.g., npm packages, bundled minified scripts).
3. **Malicious Co-installed Extensions:** Other extensions attempting to read storage or manipulate the terminal's execution context.

---

## ⚔️ Attack Vectors & Mitigations

We employ a defense-in-depth strategy. The table below outlines specific vectors and our architectural mitigations.

| Attack Vector | Mitigation Strategy | Residual Risk |
| :--- | :--- | :--- |
| **ANSI Injection via Network Data**<br>*(e.g., malicious HTTP Header)* | Untrusted string output passes through `stripAnsi()` before hitting the `xterm.js` canvas parser. Terminal manipulation via OSC sequences is neutralized. | **Low** |
| **mXSS via HTML Content**<br>*(e.g., WHOIS response containing `<script>`)* | We use an enterprise-grade sanitization library (**DOMPurify**) with a strict configuration (whitelisting only basic text formatting tags like `<b>`, `<span>`). | **Low** |
| **Supply Chain Compromise**<br>*(e.g., compromised `dompurify.min.js`)* | We do not load scripts via CDN. Dependencies are bundled locally, and a cryptographic `SHA-256` integrity check runs on `dev-lint.js` and in CI. | **Low** |
| **CDP Scope Creep**<br>*(e.g., abusing the `debugger` permission)* | Strict PR review checklist + mechanical scanning in `dev-lint.js` ensures `debugger.sendCommand()` is restricted strictly to permitted emulation utilities (`throttle.js`). | **Medium** |
| **Global `contentSettings` Pollution** | The `block` command is strictly scoped to the `activeTab` origin. It cannot set global wildcard blocks. | **Low** |

---

## Zero-Cloud Policy

To systematically eliminate data exfiltration vectors, WhatHappened operates strictly under a **Zero-Cloud Policy**:
- **No Telemetry**: Zero analytics, zero crash reporters.
- **No Backend**: We maintain no central servers. External queries are made directly from the user's browser (e.g., via Google DoH) or local background worker.
- **Strict CSP**: `script-src 'self'` prevents any external code execution.
