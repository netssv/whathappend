/**
 * @module modules/commands/util/detailed-help-network.js
 * @description Help entries for network connectivity and infrastructure commands.
 *              (hosting, history, rank, wayback, green, ping, trace,
 *               rev-dns, port-scan, ftp-check, isup)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: NETWORK_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const NETWORK_HELP = {
    hosting: () => formatHelp({ name: "hosting", syntax: "[domain|ip]", descLines: [
        "Identify the web hosting provider for a domain or IP address.",
        "",
        "WHAT IS IT?",
        "  Resolves the domain to an IP via its A record, then performs an RDAP",
        "  lookup on that IP to find the registered network owner.",
        "",
        "REAL USE CASES:",
        "  - Find if a site runs on AWS, Cloudflare, Google, or a VPS provider.",
        "  - Confirm a server migrated to the expected host after a deployment.",
        "  - Investigate an unknown IP found in server access logs.",
    ], aliases: "provider, webhost, hoster", examples: [
        { cmd: "hosting google.com" },
        { cmd: "hosting 104.21.5.1", desc: "Direct IP lookup" },
    ] }),

    history: () => formatHelp({ name: "history", syntax: "[domain]", descLines: [
        "Certificate Transparency log history.",
        "",
        "WHAT IS IT?",
        "  Queries crt.sh — a public log of every SSL certificate ever issued.",
        "  Shows the earliest and most recent certificate for the domain.",
        "",
        "REAL USE CASES:",
        "  - Find when a domain first appeared on the internet.",
        "  - Discover subdomains that were previously used (attack surface).",
        "  - Track infrastructure changes over time via cert issuance records.",
    ], aliases: "crt", examples: [{ cmd: "history shopify.com" }] }),

    rank: () => formatHelp({ name: "rank", syntax: "[domain]", descLines: [
        "Global web traffic ranking via the Tranco list.",
        "",
        "WHAT IS IT?",
        "  Tranco is an academically curated list of the top 1 million websites,",
        "  updated regularly. It replaces the discontinued Alexa Rank.",
        "",
        "REAL USE CASES:",
        "  - Gauge a site's relative global traffic before a partnership.",
        "  - Check if a competitor has grown or declined in the last 30 days.",
        "  - Verify a domain's legitimacy (malicious sites rarely rank highly).",
    ], aliases: "ranking, traffic", examples: [{ cmd: "rank google.com" }] }),

    wayback: () => formatHelp({ name: "wayback", syntax: "[domain]", descLines: [
        "Archive.org temporal persistence check.",
        "",
        "WHAT IS IT?",
        "  Checks the Internet Archive (Wayback Machine) for the first and last",
        "  time the domain was crawled and stored.",
        "",
        "REAL USE CASES:",
        "  - Confirm when a domain was first indexed by the Wayback Machine.",
        "  - Check if a currently-down site was ever live and for how long.",
        "  - Investigate the history of a recently acquired domain.",
    ], aliases: "archive", examples: [{ cmd: "wayback shopify.com" }] }),

    green: () => formatHelp({ name: "green", syntax: "[domain]", descLines: [
        "Environmental hosting check via The Green Web Foundation.",
        "",
        "WHAT IS IT?",
        "  Queries the Green Web Foundation API to determine if the domain's",
        "  hosting provider runs on verified renewable energy infrastructure.",
        "",
        "REAL USE CASES:",
        "  - Verify a sustainability claim on a company's website.",
        "  - Report green credentials to clients or ESG auditors.",
        "  - Compare hosting choices during a provider evaluation.",
    ], aliases: null, examples: [{ cmd: "green google.com" }] }),

    ping: () => formatHelp({ name: "ping", syntax: "[domain]", descLines: [
        "Server responsiveness and latency test.",
        "",
        "WHAT IS IT?",
        "  Sends 4 sequential HTTPS HEAD requests and measures the response time",
        "  in milliseconds. Useful for a quick baseline performance check.",
        "",
        "REAL USE CASES:",
        "  - Verify a server is reachable before running a full audit.",
        "  - Compare latency across multiple CDN-backed domains.",
        "  - Detect intermittent slow responses (run multiple times).",
        "  - Use before and after a CDN migration to confirm improvement.",
    ], aliases: "latency", examples: [{ cmd: "ping google.com" }] }),

    trace: () => formatHelp({ name: "trace", syntax: "[url]", descLines: [
        "Follow and display the full URL redirect chain.",
        "",
        "WHAT IS IT?",
        "  Follows every HTTP 3xx redirect step-by-step until a final response",
        "  is reached (or the max-redirect limit is hit).",
        "",
        "REAL USE CASES:",
        "  - Debug infinite redirect loops (HTTP 301/302 cycles).",
        "  - See the final destination of a URL shortener (bit.ly, t.co).",
        "  - Verify an HTTP-to-HTTPS redirect is in place and correct.",
        "  - Confirm a www-to-apex redirect is not adding unnecessary hops.",
    ], aliases: "redirect, follow, traceroute", examples: [
        { cmd: "trace google.com" },
        { cmd: "trace bit.ly/example", desc: "Resolve shortlink destination" },
    ] }),

    "rev-dns": () => formatHelp({ name: "rev-dns", syntax: "[ip]", descLines: [
        "Reverse DNS lookup (PTR record).",
        "",
        "WHAT IS IT?",
        "  A PTR record maps an IP address back to a hostname. A matching forward",
        "  and reverse DNS setup is required for mail server deliverability.",
        "",
        "REAL USE CASES:",
        "  - Given an IP from server logs, find the responsible domain name.",
        "  - Verify a mail server's PTR matches its A record (deliverability).",
        "  - Identify the hosting provider behind an unknown IP address.",
    ], aliases: "rdns, ptr, reverse-dns", examples: [
        { cmd: "rev-dns 8.8.8.8", desc: "Resolve Google's DNS IP to hostname" },
    ] }),

    "port-scan": () => formatHelp({ name: "port-scan", syntax: "[domain] [ports]", descLines: [
        "Scan for open network ports.",
        "",
        "WHAT IS IT?",
        "  Attempts TCP connections to common ports and reports which are open.",
        "  Open ports = exposed services. Each exposed service is an attack surface.",
        "",
        "REAL USE CASES:",
        "  - Confirm only 80 and 443 are open on a production web server.",
        "  - Check if SSH (22), FTP (21), or Telnet (23) are exposed publicly.",
        "  - Verify database ports (3306, 5432) are not internet-accessible.",
        "  - Run on a new VPS after setup to confirm the firewall is correct.",
    ], aliases: "ports, nmap, portscan", examples: [
        { cmd: "port-scan google.com",     desc: "Scan common ports" },
        { cmd: "port-scan example.com 22", desc: "Check SSH specifically" },
    ] }),

    "ftp-check": () => formatHelp({ name: "ftp-check", syntax: "[domain]", descLines: [
        "Check if an insecure FTP server is accessible on port 21.",
        "",
        "WHAT IS IT?",
        "  FTP (File Transfer Protocol) transmits credentials in plain text.",
        "  Grabs the FTP banner to confirm the server is running and its version.",
        "",
        "REAL USE CASES:",
        "  - Detect legacy FTP servers still running on modern infrastructure.",
        "  - Flag as a critical security risk in a client security report.",
        "  - Identify the FTP software version for vulnerability lookup.",
    ], aliases: "ftp", examples: [{ cmd: "ftp-check example.com" }] }),

    isup: () => formatHelp({ name: "isup", syntax: "[domain]", descLines: [
        "Network parity check — is it down for everyone or just me?",
        "",
        "WHAT IS IT?",
        "  Compares your local reachability against a public uptime API to",
        "  determine if an outage is global or specific to your ISP or network.",
        "",
        "REAL USE CASES:",
        "  - Confirm if a site is globally down or blocked by your ISP.",
        "  - Rule out your own network before escalating to a vendor.",
        "  - Monitor availability gaps during a DNS migration.",
    ], aliases: "upcheck, down, downcheck, status", examples: [
        { cmd: "isup google.com" },
    ] }),
};
