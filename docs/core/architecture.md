# Architecture

WhatHappened is a strict **Manifest V3** extension built for performance and reliability:

- **xterm.js** For that authentic, high-performance terminal feel.
- **Atomic Architecture**: Our modules are strictly organized and kept under 200 lines to ensure the code stays fast and bug-free.
- **AST Pipeline Engine**: We use a custom-built POSIX-compliant parser that enables complex command chaining (`|`) and advanced argument handling.
- **Heuristic Engine**: We don't rely on hardcoded "provider lists." We analyze live CNAME chains and IP data to figure out infrastructure on the fly.

[⬅ Return to Home](../../README.md)
