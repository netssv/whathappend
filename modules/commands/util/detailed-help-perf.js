/**
 * @module modules/commands/util/detailed-help-perf.js
 * @description Help entries for performance, measurement, and request-control commands.
 *              (jitter, speedtest, ip, diff, load, watch, block, extract)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: PERF_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const PERF_HELP = {
    jitter: () => formatHelp({ name: "jitter", syntax: "[domain]", descLines: [
        "Latency consistency and jitter measurement.",
        "",
        "WHAT IS IT?",
        "  Sends 5 sequential HEAD requests and computes average latency and",
        "  standard deviation (jitter). High jitter means inconsistent performance.",
        "",
        "REAL USE CASES:",
        "  - Diagnose intermittent slowness on a site that is 'sometimes fast'.",
        "  - Compare CDN edge node stability across multiple test runs.",
        "  - Quantify performance improvement after enabling or switching a CDN.",
        "  - Detect overloaded origin servers that respond inconsistently.",
    ], aliases: "speed, latency-test", examples: [{ cmd: "jitter google.com" }] }),

    speedtest: () => formatHelp({ name: "speedtest", syntax: "[size_mb]", descLines: [
        "Local internet bandwidth measurement.",
        "",
        "WHAT IS IT?",
        "  Downloads a timed payload from Cloudflare's speed endpoint and",
        "  calculates your actual download throughput in Mbps.",
        "",
        "REAL USE CASES:",
        "  - Verify your connection speed before attributing slowness to a site.",
        "  - Run before and after changing DNS or VPN to detect throughput changes.",
        "  - Use a larger payload (50-90 MB) for more accurate measurements.",
        "  - Diagnose bandwidth throttling by your ISP.",
    ], aliases: "bandwidth, nettest", examples: [
        { cmd: "speedtest",     desc: "10 MB default" },
        { cmd: "speedtest 50",  desc: "50 MB for more accuracy" },
    ] }),

    ip: () => formatHelp({ name: "ip", syntax: "[domain]", descLines: [
        "Dual-mode IP lookup command.",
        "",
        "WHAT IS IT?",
        "  Without arguments: shows your own public IP address and ISP name.",
        "  With a domain: resolves the A record and identifies the hosting provider.",
        "",
        "REAL USE CASES:",
        "  - Confirm your real IP before testing geo-restricted content.",
        "  - Verify a domain resolves to the expected server IP after a migration.",
        "  - Identify the hosting provider for a target domain in one step.",
        "  - Detect load-balanced IPs (multiple A records) for the same domain.",
    ], aliases: "myip, public-ip", examples: [
        { cmd: "ip",            desc: "Your public IP and ISP" },
        { cmd: "ip google.com", desc: "Resolve domain IP + hosting" },
    ] }),

    diff: () => formatHelp({ name: "diff", syntax: "<domain1> <domain2>", descLines: [
        "DNS infrastructure comparison between two domains.",
        "",
        "WHAT IS IT?",
        "  Resolves A records for both domains and compares the resulting IPs",
        "  and hosting providers side-by-side.",
        "",
        "REAL USE CASES:",
        "  - Confirm two domains point to the same server after a consolidation.",
        "  - Verify a staging environment matches the production IP.",
        "  - Compare a brand domain vs a suspected typosquat domain.",
        "  - Check if a domain alias (CNAME) resolves to the same endpoint.",
    ], aliases: null, examples: [
        { cmd: "diff google.com bing.com" },
    ] }),

    load: () => formatHelp({ name: "load", syntax: "[domain]", descLines: [
        "Detailed page load timing breakdown.",
        "",
        "WHAT IS IT?",
        "  Uses the Navigation Timing API to measure each phase of the page load:",
        "  DNS lookup, TCP connection, TLS handshake, TTFB, and content transfer.",
        "",
        "REAL USE CASES:",
        "  - Pinpoint which phase is the bottleneck (slow TTFB vs slow DNS).",
        "  - Compare timings before and after a performance optimization.",
        "  - Use with throttle to simulate mobile connection load times.",
        "  - Include in a client performance report with concrete millisecond data.",
    ], aliases: "perf, performance, pagespeed, timing", examples: [
        { cmd: "load google.com" },
    ] }),

    watch: () => formatHelp({ name: "watch", syntax: "[waterfall|raw]", descLines: [
        "Live network activity monitor.",
        "",
        "WHAT IS IT?",
        "  Hooks into the active tab's network stack and streams or aggregates",
        "  request data in real time without leaving the terminal.",
        "",
        "  Default:   dashboard of heap, DOM node count, and total page weight.",
        "  waterfall: graphical request timeline with per-resource timing bars.",
        "  raw:       streaming log of full request URLs as they load.",
        "",
        "REAL USE CASES:",
        "  - Catch unexpected third-party requests firing on page load.",
        "  - Profile a page that grows in memory over time (memory leak).",
        "  - Use waterfall to find the render-blocking resource.",
    ], aliases: "monitor, live, netwatch", examples: [
        { cmd: "watch",           desc: "Dashboard metrics" },
        { cmd: "watch waterfall", desc: "Request timeline" },
        { cmd: "watch raw",       desc: "Live URL stream" },
    ] }),

    block: () => formatHelp({ name: "block", syntax: "[pattern]", descLines: [
        "Block network requests matching a wildcard pattern.",
        "",
        "WHAT IS IT?",
        "  Uses Chrome DevTools Protocol (CDP) to intercept and drop requests",
        "  matching a wildcard before they reach the network stack.",
        "",
        "REAL USE CASES:",
        "  - Block analytics scripts (block *analytics*) during load testing.",
        "  - Prevent image loads (block *.png) to test text-only rendering.",
        "  - Simulate a failing CDN by blocking its domain pattern.",
        "  - Remove third-party scripts to measure their performance cost.",
        "  - Use --list to review active blocks, --clear to remove all.",
    ], aliases: "ban, deny, drop", examples: [
        { cmd: "block *.png",   desc: "Block all PNG requests" },
        { cmd: "block --list",  desc: "View active blocks" },
        { cmd: "block --clear", desc: "Remove all blocks" },
    ] }),

    extract: () => formatHelp({ name: "extract", syntax: "<flag>", descLines: [
        "Unified page content extractor.",
        "",
        "WHAT IS IT?",
        "  Consolidates all DOM scraping operations under one command interface.",
        "  Each flag targets a specific content type in the active tab.",
        "",
        "  -emails    Find all email addresses in the page DOM.",
        "  -phones    Find all phone numbers (tel: links and text patterns).",
        "  -links     List all hyperlinks (flags insecure http:// ones).",
        "  -images    List all image sources.",
        "  -docs      Find downloadable document links (PDF, DOCX, XLS).",
        "  -comments  Extract HTML and JS comments from the DOM.",
        "",
        "REAL USE CASES:",
        "  - Scrape contact info from a directory page in one command.",
        "  - Audit a page for insecure links before publishing.",
        "  - Find all documents hosted on a client site for an inventory.",
    ], aliases: null, examples: [
        { cmd: "extract -emails" },
        { cmd: "extract -links" },
        { cmd: "extract -docs" },
        { cmd: "extract", desc: "Show all available flags" },
    ] }),
};
