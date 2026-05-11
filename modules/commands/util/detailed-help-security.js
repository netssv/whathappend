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
        "  - Check if HSTS is configured with a long max-age (1 year or more).",
    ], aliases: "security, scan", examples: [{ cmd: "sec google.com" }] }),

    csp: () => formatHelp({ name: "csp", syntax: "[domain]", descLines: [
        "Content-Security-Policy header analyzer.",
        "",
        "WHAT IS IT?",
        "  CSP restricts what scripts, styles, and resources a page can load.",
        "  A weak or missing CSP is the primary enabler of XSS attacks.",
        "",
        "REAL USE CASES:",
        "  - Detect dangerous directives: unsafe-inline, unsafe-eval.",
        "  - Check if object-src is missing (allows plugin injection).",
        "  - Audit a site after a reported script injection incident.",
        "  - Confirm CSP is in enforce mode, not just report-only.",
    ], aliases: "xss", examples: [{ cmd: "csp google.com" }] }),

    waf: () => formatHelp({ name: "waf", syntax: "[domain]", descLines: [
        "Web Application Firewall and CDN detection.",
        "",
        "WHAT IS IT?",
        "  Scans HTTP response headers for fingerprints identifying the network",
        "  protection layer: Cloudflare, Akamai, AWS CloudFront, Sucuri, Imperva.",
        "",
        "REAL USE CASES:",
        "  - Confirm a site is behind a WAF before running other tests.",
        "  - Use with ip-spoof to test if the WAF trusts forwarded headers.",
        "  - Identify CDN providers for caching and performance analysis.",
        "  - Detect when a WAF is silently removed or changed.",
    ], aliases: "firewall, cdn-check", examples: [{ cmd: "waf google.com" }] }),

    hsts: () => formatHelp({ name: "hsts", syntax: "[domain]", descLines: [
        "HTTP Strict Transport Security audit.",
        "",
        "WHAT IS IT?",
        "  HSTS is a security header that tells browsers to only connect via HTTPS",
        "  for a specified duration (max-age), even if the user types http://.",
        "",
        "REAL USE CASES:",
        "  - Confirm max-age is 1 year or more (31536000 seconds).",
        "  - Check if includeSubDomains is set to protect all subdomains.",
        "  - Verify preload flag is present before submitting to the HSTS preload list.",
        "  - Detect if HSTS was accidentally removed after a server change.",
    ], aliases: "strict, secure-transport", examples: [{ cmd: "hsts google.com" }] }),

    "headers-check": () => formatHelp({ name: "headers-check", syntax: "[domain]", descLines: [
        "Security header batch checklist.",
        "",
        "WHAT IS IT?",
        "  Checks four headers that browsers use to protect users from common",
        "  attack vectors: clickjacking, MIME sniffing, referrer leaks, and",
        "  access to sensitive browser APIs.",
        "",
        "REAL USE CASES:",
        "  - X-Frame-Options: prevents clickjacking (embedding in iframes).",
        "  - X-Content-Type-Options: stops MIME-type sniffing attacks.",
        "  - Referrer-Policy: controls what URL is sent in the Referer header.",
        "  - Permissions-Policy: restricts access to camera, mic, geolocation.",
    ], aliases: "hcheck, security-headers", examples: [{ cmd: "headers-check google.com" }] }),

    curl: () => formatHelp({ name: "curl", syntax: "[url]", descLines: [
        "Fetch raw HTTP response headers from the server.",
        "",
        "WHAT IS IT?",
        "  Sends a HEAD request (no body) and returns the raw server headers.",
        "  The most direct way to see exactly what the server is responding with.",
        "",
        "REAL USE CASES:",
        "  - Check the exact HTTP status code (200, 301, 403, 500).",
        "  - Verify security headers are present in production.",
        "  - Inspect cache-control and content-type headers.",
        "  - Debug CORS (Access-Control-Allow-Origin) headers.",
    ], aliases: "http, headers", examples: [{ cmd: "curl google.com" }] }),

    openssl: () => formatHelp({ name: "openssl", syntax: "[domain]", descLines: [
        "Inspect the SSL/TLS certificate in detail.",
        "",
        "WHAT IS IT?",
        "  Performs a TLS handshake and parses the certificate to show the issuer,",
        "  subject, expiry date, Subject Alt Names, and cipher suite.",
        "",
        "REAL USE CASES:",
        "  - Verify the issuer (Let's Encrypt vs commercial CA).",
        "  - Check expiry date to prevent unexpected HTTPS outages.",
        "  - Confirm all subdomains are in the Subject Alt Names.",
        "  - Detect mismatched or self-signed certificates.",
    ], aliases: "ssl, cert, tls", examples: [{ cmd: "openssl google.com" }] }),

    whois: () => formatHelp({ name: "whois", syntax: "[domain]", descLines: [
        "Domain registration data via RDAP/WHOIS.",
        "",
        "WHAT IS IT?",
        "  Queries the RDAP protocol (the modern WHOIS replacement) for the",
        "  domain's registration record: owner, registrar, dates, nameservers.",
        "",
        "REAL USE CASES:",
        "  - Find who owns a domain and when it was registered.",
        "  - Check the expiry date to see if a domain will lapse soon.",
        "  - Identify the registrar for transfer or dispute purposes.",
        "  - Detect privacy-protected registrations on suspicious domains.",
    ], aliases: "domain", examples: [{ cmd: "whois google.com" }] }),

    "security-txt": () => formatHelp({ name: "security-txt", syntax: "[domain]", descLines: [
        "RFC 9116 security contact discovery.",
        "",
        "WHAT IS IT?",
        "  security.txt is a standard file at /.well-known/security.txt that",
        "  organizations publish to tell researchers how to report vulnerabilities.",
        "",
        "REAL USE CASES:",
        "  - Find a responsible disclosure contact before reporting a bug.",
        "  - Verify a company has a security program in place.",
        "  - Check if the Encryption field provides a PGP key for secure comms.",
        "  - Audit a client's security posture readiness before a pentest.",
    ], aliases: "sec-txt, securitytxt", examples: [{ cmd: "security-txt google.com" }] }),

    cookies: () => formatHelp({ name: "cookies", syntax: "[domain]", descLines: [
        "Cookie privacy and security audit.",
        "",
        "WHAT IS IT?",
        "  Extracts and analyzes all cookies set by the domain, checking each one",
        "  for missing security attributes that could allow attacks.",
        "",
        "REAL USE CASES:",
        "  - Flag session cookies missing HttpOnly (accessible to JS = XSS risk).",
        "  - Detect cookies missing Secure (sent over HTTP = interception risk).",
        "  - Check for SameSite=None without Secure (CSRF vulnerability).",
        "  - Enumerate all cookies before a GDPR or privacy compliance audit.",
    ], aliases: null, examples: [{ cmd: "cookies google.com" }] }),

    malware: () => formatHelp({ name: "malware", syntax: "[--test]", descLines: [
        "Client-side heuristic security scan (active tab).",
        "",
        "WHAT IS IT?",
        "  Analyzes the DOM and inline scripts of the active tab using heuristic",
        "  patterns to detect signs of client-side compromise.",
        "",
        "REAL USE CASES:",
        "  - Detect hidden iframes used for drive-by download attacks.",
        "  - Find heavily obfuscated JavaScript that may be a cryptominer.",
        "  - Scan a compromised site to locate injected malicious scripts.",
        "  - Use --test on a known-clean page to validate the scanner baseline.",
    ], aliases: "virus, heuristics", examples: [
        { cmd: "malware" },
        { cmd: "malware --test" },
    ] }),
};
