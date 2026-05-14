# Security Policy

WhatHappened is built on a foundation of transparency and "Zero-Cloud" privacy. This document outlines our security commitments and the process for reporting vulnerabilities.

## Supported Versions

We only provide security updates for the latest major release.

| Version | Supported |
| ------- | --------- |
| 3.2.x   | ✅ Yes     |
| 3.1.x   | ❌ No      |
| 3.0.x   | ❌ No      |
| 2.x     | ❌ No      |

---

## Our Security Commitment

WhatHappened operates strictly on the edge. This means:
1. **Zero Data Exfiltration**: Your diagnostic history, audited URLs, and browser state never leave your local machine.
2. **Enterprise-Grade Sanitization**: We use **DOMPurify** to protect the terminal from mXSS (Mutation XSS) when auditing untrusted sites.
3. **Transparent Logic**: Our diagnostic heuristic engine is open-source and verifiable.

For a deep dive into our security architecture, please review our core documentation:
- [Architecture & Execution Lifecycle](docs/core/architecture.md)
- [Security & Privacy Policy (Detailed)](docs/core/security.md)
- [Permissions & Compliance Scope](docs/core/permissions.md)

---

## Bundled Dependency Integrity

To protect against supply-chain attacks, we bundle critical dependencies locally and track their cryptographic hashes.

| Library       | Version | SHA-256 |
| ------------- | ------- | ------- |
| dompurify.min | 3.0.6   | ea4b09082ca4ba0ae71be6431a097678751d0453b9c52a4d2c7c39a2166ed9fc |

---

## Reporting a Vulnerability

If you discover a security vulnerability within WhatHappened, please help us protect our users by reporting it responsibly.

**Please do not open a public issue for security vulnerabilities.**

Instead, please send a detailed report to the maintainers or via a private security advisory on GitHub. Your report should include:
- A description of the vulnerability.
- Steps to reproduce the issue (PoC).
- Potential impact.

We strive to acknowledge all security reports within 48 hours and provide a fix or mitigation strategy as quickly as possible.

---

**Thank you for helping us keep WhatHappened secure and private.**
