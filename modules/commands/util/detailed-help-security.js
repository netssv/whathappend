/**
 * @module modules/commands/util/detailed-help-security.js
 * @description Help entries for HTTP security audit commands.
 *              (sec, csp, waf, hsts, headers-check, curl, openssl, whois,
 *               security-txt, cookies, malware)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: SECURITY_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const SECURITY_HELP = {
    sec: () => formatHelp({ name: "sec", syntax: "[domain]", descLines: [
        "Frontend security scorecard.",
        "",
        "WHAT IS IT?",
        "  Checks if the server enforces HTTPS via HSTS and audits the security",
        "  headers that protect users from XSS and clickjacking attacks.",
        "",
        "REAL USE CASES:",
        "  - Run before a site launch to catch missing security headers.",
        "  - Identify domains serving mixed HTTP/HTTPS content.",
        "  - Check if HSTS is set with a long max-age (1 year or more).",
    ], aliases: "security, scan", examples: [{ cmd: "sec google.com" }] }),

    csp: () => formatHelp({ name: "csp", syntax: "[domain]", descLines: [
        "Content-Security-Policy header analyzer.",
        "",
        "WHAT IS IT?",
        "  CSP restricts what scripts, styles, and media a page can load.",
        "  A weak or missing CSP allows Cross-Site Scripting (XSS) attacks.",
        "",
        "REAL USE CASES:",
        "  - Detect unsafe directives: unsafe-inline or unsafe-eval.",
        "  - Check if object-src is missing (enables plugin injection).",
        "  - Audit a site after a reported script injection incident.",
    ], aliases: "xss", examples: [{ cmd: "csp google.com" }] }),

    waf: () => formatHelp({ name: "waf", syntax: "[domain]", descLines: [
        "Web Application Firewall and CDN detection.",
        "",
        "WHAT IS IT?",
        "  Scans HTTP response headers for signatures from Cloudflare, Akamai,",
        "  AWS CloudFront, Sucuri, Imperva, and Fastly.",
        "",
        "REAL USE CASES:",
        "  - Confirm a site is behind a WAF before running other tests.",
        "  - Combine with ip-spoof to test if the WAF trusts forwarded headers.",
        "  - Identify CDN providers for performance and caching analysis.",
    ], aliases: "firewall, cdn-check", examples: [{ cmd: "waf google.com" }] }),

    hsts: () => formatHelp({ name: "hsts", syntax: "[domain]", descLines: [
        "HTTP Strict Transport Security audit.",
        "Verifies max-age, includeSubDomains, and preload directives",
        "to confirm the site enforces HTTPS for all future connections.",
    ], aliases: "strict, secure-transport", examples: [{ cmd: "hsts google.com" }] }),

    "headers-check": () => formatHelp({ name: "headers-check", syntax: "[domain]", descLines: [
        "Security header batch checklist.",
        "Audits X-Frame-Options, Referrer-Policy, X-Content-Type-Options,",
        "and Permissions-Policy in a single request.",
    ], aliases: "hcheck, security-headers", examples: [{ cmd: "headers-check google.com" }] }),

    curl: () => formatHelp({ name: "curl", syntax: "[url]", descLines: [
        "Fetch raw HTTP response headers from the server.",
        "",
        "REAL USE CASES:",
        "  - Check the exact HTTP status code (200, 301, 403, 500).",
        "  - Inspect server, cache-control, and content-type headers.",
        "  - Verify security headers are present on the production server.",
    ], aliases: "http, headers", examples: [{ cmd: "curl google.com" }] }),

    openssl: () => formatHelp({ name: "openssl", syntax: "[domain]", descLines: [
        "Inspect the SSL/TLS certificate.",
        "",
        "REAL USE CASES:",
        "  - Verify the certificate issuer (Let's Encrypt vs commercial CA).",
        "  - Check the expiry date to prevent unexpected HTTPS outages.",
        "  - Confirm all subdomains are covered in the Subject Alt Names.",
    ], aliases: "ssl, cert, tls", examples: [{ cmd: "openssl google.com" }] }),

    whois: () => formatHelp({ name: "whois", syntax: "[domain]", descLines: [
        "Domain registration data via RDAP/WHOIS.",
        "",
        "REAL USE CASES:",
        "  - Find who owns a domain and when it was registered.",
        "  - Check the expiry date to see if a domain will lapse soon.",
        "  - Identify the registrar for dispute or transfer purposes.",
    ], aliases: "domain", examples: [{ cmd: "whois google.com" }] }),

    "security-txt": () => formatHelp({ name: "security-txt", syntax: "[domain]", descLines: [
        "RFC 9116 security contact discovery.",
        "Fetches /.well-known/security.txt and parses Contact, Policy,",
        "and Encryption fields for responsible disclosure workflows.",
    ], aliases: "sec-txt, securitytxt", examples: [{ cmd: "security-txt google.com" }] }),

    cookies: () => formatHelp({ name: "cookies", syntax: "[domain]", descLines: [
        "Cookie privacy audit.",
        "",
        "REAL USE CASES:",
        "  - Flag session cookies missing the HttpOnly or Secure attribute.",
        "  - Check for SameSite=None cookies that may enable CSRF attacks.",
        "  - Enumerate all cookies set by a domain before a privacy audit.",
    ], aliases: null, examples: [{ cmd: "cookies google.com" }] }),

    malware: () => formatHelp({ name: "malware", syntax: "[--test]", descLines: [
        "Client-side heuristic security scan (active tab).",
        "",
        "REAL USE CASES:",
        "  - Detect hidden iframes used for drive-by download attacks.",
        "  - Find heavily obfuscated JavaScript that may be a cryptominer.",
        "  - Scan a compromised site to locate injected malicious scripts.",
    ], aliases: "virus, heuristics", examples: [
        { cmd: "malware" },
        { cmd: "malware --test" },
    ] }),
};
