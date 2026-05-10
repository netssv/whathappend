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
        "  Sends 5 sequential HEAD requests and calculates average latency",
        "  and standard deviation (jitter). High jitter means inconsistent",
        "  performance — a sign of congestion or an unstable connection.",
        "",
        "REAL USE CASES:",
        "  - Diagnose intermittent slowness on a site that is 'sometimes fast'.",
        "  - Compare CDN edge node performance across multiple test runs.",
        "  - Quantify improvement before and after enabling a CDN.",
    ], aliases: "speed, latency-test", examples: [{ cmd: "jitter google.com" }] }),

    speedtest: () => formatHelp({ name: "speedtest", syntax: "[size_mb]", descLines: [
        "Local internet bandwidth test.",
        "Downloads a timed payload from Cloudflare's speed endpoint.",
        "Default: 10 MB. Maximum: 90 MB.",
    ], aliases: "bandwidth, nettest", examples: [
        { cmd: "speedtest",     desc: "10 MB default" },
        { cmd: "speedtest 50",  desc: "50 MB for more accuracy" },
    ] }),

    ip: () => formatHelp({ name: "ip", syntax: "[domain]", descLines: [
        "Dual-mode IP command.",
        "",
        "  No argument:  shows your public IP address and ISP name.",
        "  With domain:  resolves the A record and identifies the hosting provider.",
    ], aliases: "myip, public-ip", examples: [
        { cmd: "ip",            desc: "Your public IP" },
        { cmd: "ip google.com", desc: "Resolve domain IP" },
    ] }),

    diff: () => formatHelp({ name: "diff", syntax: "<domain1> <domain2>", descLines: [
        "DNS infrastructure comparison between two domains.",
        "",
        "REAL USE CASES:",
        "  - Confirm two domains point to the same server after a consolidation.",
        "  - Verify a staging environment matches the production IP.",
        "  - Compare a brand's domain vs a suspected typosquat domain.",
    ], aliases: null, examples: [{ cmd: "diff google.com bing.com" }] }),

    load: () => formatHelp({ name: "load", syntax: "[domain]", descLines: [
        "Performance and page load timing breakdown.",
        "",
        "REAL USE CASES:",
        "  - Measure TTFB (Time to First Byte) to assess server response speed.",
        "  - Compare FCP and LCP before and after a performance optimization.",
        "  - Use with throttle to simulate mobile load times.",
    ], aliases: "perf, performance, pagespeed, timing", examples: [
        { cmd: "load google.com" },
    ] }),

    watch: () => formatHelp({ name: "watch", syntax: "[waterfall|raw]", descLines: [
        "Live network activity monitor.",
        "",
        "  Default:   dashboard of heap, DOM node count, and total page weight.",
        "  waterfall: graphical request timeline with per-resource timing bars.",
        "  raw:       streaming log of full request URLs as they are made.",
        "",
        "REAL USE CASES:",
        "  - Catch unexpected third-party requests firing on page load.",
        "  - Profile a page that grows in memory over time (memory leak).",
        "  - Use waterfall to identify which resource is blocking render.",
    ], aliases: "monitor, live, netwatch", examples: [
        { cmd: "watch",           desc: "Dashboard metrics" },
        { cmd: "watch waterfall", desc: "Request timeline" },
        { cmd: "watch raw",       desc: "Live URL stream" },
    ] }),

    block: () => formatHelp({ name: "block", syntax: "[pattern]", descLines: [
        "Block network requests matching a wildcard pattern.",
        "",
        "REAL USE CASES:",
        "  - Block all analytics scripts (block *analytics*) during testing.",
        "  - Prevent image loads (block *.png) to test text-only layouts.",
        "  - Simulate a failing CDN by blocking its domain pattern.",
        "  - Use --list to review active blocks, --clear to remove all.",
    ], aliases: "ban, deny, drop", examples: [
        { cmd: "block *.png",   desc: "Block all PNG requests" },
        { cmd: "block --list",  desc: "View active blocks" },
        { cmd: "block --clear", desc: "Remove all blocks" },
    ] }),

    extract: () => formatHelp({ name: "extract", syntax: "<flag>", descLines: [
        "Unified page content extractor.",
        "Consolidates all scraping operations under one command.",
        "Flags: -emails, -phones, -links, -images, -docs, -comments.",
        "Links and document results are rendered as clickable hyperlinks.",
    ], aliases: null, examples: [
        { cmd: "extract -emails" },
        { cmd: "extract -links" },
        { cmd: "extract -images" },
        { cmd: "extract -docs" },
        { cmd: "extract", desc: "Show all available flags" },
    ] }),
};
