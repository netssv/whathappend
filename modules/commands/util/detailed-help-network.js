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
        "  Resolves the domain to an IP via its A record, then runs an RDAP",
        "  lookup on that IP to find the registered network owner.",
        "",
        "REAL USE CASES:",
        "  - Find if a site runs on AWS, Cloudflare, Google, or a VPS.",
        "  - Confirm a server moved to the expected host after a migration.",
        "  - Investigate an unknown IP address found in server logs.",
    ], aliases: "provider, webhost, hoster", examples: [
        { cmd: "hosting google.com" },
        { cmd: "hosting 104.21.5.1", desc: "Direct IP lookup" },
    ] }),

    history: () => formatHelp({ name: "history", syntax: "[domain]", descLines: [
        "Certificate Transparency log history.",
        "",
        "REAL USE CASES:",
        "  - See the earliest SSL certificate issued for a domain.",
        "  - Find subdomains previously used and now possibly abandoned.",
        "  - Trace infrastructure changes over time via cert issuance records.",
    ], aliases: "crt", examples: [{ cmd: "history shopify.com" }] }),

    rank: () => formatHelp({ name: "rank", syntax: "[domain]", descLines: [
        "Global web traffic ranking via the Tranco list.",
        "Shows the domain's current rank and 30-day trend.",
        "Replaces the discontinued Alexa Rank service.",
    ], aliases: "ranking, traffic", examples: [{ cmd: "rank google.com" }] }),

    wayback: () => formatHelp({ name: "wayback", syntax: "[domain]", descLines: [
        "Archive.org temporal persistence check.",
        "",
        "REAL USE CASES:",
        "  - Confirm when a domain was first indexed by the Wayback Machine.",
        "  - Check if a currently-down site was ever live.",
        "  - Investigate the history of a recently acquired domain.",
    ], aliases: "archive", examples: [{ cmd: "wayback shopify.com" }] }),

    green: () => formatHelp({ name: "green", syntax: "[domain]", descLines: [
        "Environmental hosting check via The Green Web Foundation.",
        "Verifies whether the domain is hosted on renewable energy infrastructure.",
    ], aliases: null, examples: [{ cmd: "green google.com" }] }),

    ping: () => formatHelp({ name: "ping", syntax: "[domain]", descLines: [
        "Server responsiveness and latency test.",
        "Sends 4 sequential HTTPS HEAD requests and reports response times in ms.",
    ], aliases: "latency", examples: [{ cmd: "ping google.com" }] }),

    trace: () => formatHelp({ name: "trace", syntax: "[url]", descLines: [
        "Follow and display the full URL redirect chain.",
        "",
        "REAL USE CASES:",
        "  - Debug infinite redirect loops (HTTP 301/302 cycles).",
        "  - See the final destination of a URL shortener (bit.ly, t.co).",
        "  - Verify an HTTP-to-HTTPS redirect is in place and correct.",
    ], aliases: "redirect, follow, traceroute", examples: [
        { cmd: "trace google.com" },
        { cmd: "trace bit.ly/example", desc: "Resolve shortlink destination" },
    ] }),

    "rev-dns": () => formatHelp({ name: "rev-dns", syntax: "[ip]", descLines: [
        "Reverse DNS lookup (PTR record).",
        "",
        "REAL USE CASES:",
        "  - Given an IP from server logs, find the responsible domain name.",
        "  - Verify that a mail server's PTR record matches its A record.",
        "  - Identify the hosting provider behind an unknown IP address.",
    ], aliases: "rdns, ptr, reverse-dns", examples: [
        { cmd: "rev-dns 8.8.8.8", desc: "Resolve Google DNS IP to hostname" },
    ] }),

    "port-scan": () => formatHelp({ name: "port-scan", syntax: "[domain] [ports]", descLines: [
        "Scan for open network ports.",
        "",
        "WHAT IS IT?",
        "  Attempts TCP connections to common ports and reports which are open.",
        "",
        "REAL USE CASES:",
        "  - Check if SSH (22), FTP (21), or Telnet (23) are exposed publicly.",
        "  - Verify database ports (3306, 5432) are not internet-accessible.",
        "  - Confirm only 80 and 443 are open on a production web server.",
    ], aliases: "ports, nmap, portscan", examples: [
        { cmd: "port-scan google.com",     desc: "Scan common ports" },
        { cmd: "port-scan example.com 22", desc: "Check SSH specifically" },
    ] }),

    "ftp-check": () => formatHelp({ name: "ftp-check", syntax: "[domain]", descLines: [
        "Check if an insecure FTP server is accessible on port 21.",
        "Grabs the FTP banner to identify server software and version.",
        "FTP transmits credentials in plaintext — this is a security risk.",
    ], aliases: "ftp", examples: [{ cmd: "ftp-check example.com" }] }),

    isup: () => formatHelp({ name: "isup", syntax: "[domain]", descLines: [
        "Network parity check — is it down for everyone or just me?",
        "",
        "WHAT IS IT?",
        "  Compares your local reachability against a public uptime API",
        "  to determine if an outage is global or specific to your ISP.",
        "",
        "REAL USE CASES:",
        "  - Confirm if a site is globally down or blocked by your ISP.",
        "  - Rule out your own network before escalating to a vendor.",
        "  - Monitor availability gaps during a DNS migration.",
    ], aliases: "upcheck, down, downcheck, status", examples: [
        { cmd: "isup google.com" },
    ] }),
};
