/**
 * @module modules/commands/util/detailed-help-emulation.js
 * @description Help entries for emulation and security testing commands.
 *              (useragent, mobile, throttle, geo, ip-spoof)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: EMULATION_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const EMULATION_HELP = {
    useragent: () => formatHelp({ name: "useragent", syntax: "[preset]", descLines: [
        "[Requires sudo] Override the browser's User-Agent string.",
        "",
        "WHAT IS IT?",
        "  The User-Agent tells websites what browser and OS you are using.",
        "  Changing it lets you impersonate other browsers, bots, or devices.",
        "",
        "REAL USE CASES:",
        "  - Test if a site serves different content to Googlebot vs humans.",
        "  - Check if a paywall or geo-redirect only blocks certain browsers.",
        "  - Debug responsive designs by emulating iOS Safari from a desktop.",
        "  - Detect if a WAF or CDN is fingerprinting the User-Agent header.",
        "  - Verify API endpoints that reject non-standard agent strings.",
        "",
        "NOTE: Some sites use JavaScript-based fingerprinting beyond the UA header.",
        "  Use 'mobile' to also adjust the viewport and touch events.",
    ], aliases: "ua, agent, spoof", examples: [
        { cmd: "ua chrome",  desc: "Emulate latest Chrome on Windows" },
        { cmd: "ua safari",  desc: "Emulate Safari on macOS" },
        { cmd: "ua bot",     desc: "Emulate Googlebot crawler" },
        { cmd: "ua reset",   desc: "Restore your real browser agent" },
    ]}),

    mobile: () => formatHelp({ name: "mobile", syntax: "[preset]", descLines: [
        "[Requires sudo] Emulate a mobile device environment.",
        "",
        "WHAT IS IT?",
        "  Overrides the User-Agent AND sets the viewport to match a real device.",
        "  This mimics how a site behaves when opened on an actual phone.",
        "",
        "REAL USE CASES:",
        "  - Check if a site shows a cookie banner only on mobile.",
        "  - Test if a paywall or ad layout changes on iOS vs Android.",
        "  - Validate AMP or PWA paths that only activate on mobile agents.",
        "  - Detect tracking pixels that fire only on mobile page views.",
        "  - Audit if a mobile site loads lighter images or less JavaScript.",
        "",
        "NOTE: Some sites also check screen resolution or touch event support.",
        "  Use 'ua' for just the agent change without viewport adjustment.",
    ], aliases: "mob, responsive, iphone", examples: [
        { cmd: "mobile iphone",  desc: "Emulate iPhone 14 Safari" },
        { cmd: "mobile android", desc: "Emulate Android Chrome" },
        { cmd: "mobile reset",   desc: "Restore desktop view" },
    ]}),

    throttle: () => formatHelp({ name: "throttle", syntax: "[preset]", descLines: [
        "[Requires sudo] Simulate slow or limited network conditions.",
        "",
        "WHAT IS IT?",
        "  Artificially limits your connection speed so the site thinks",
        "  you are on a mobile network, satellite link, or rural 3G connection.",
        "",
        "REAL USE CASES:",
        "  - Test if a site lazy-loads images under slow connections.",
        "  - Check if heavy JavaScript bundles cause timeouts on 3G users.",
        "  - Verify if a CDN serves compressed assets under bandwidth pressure.",
        "  - Simulate a rural user and compare Core Web Vitals (LCP, FID).",
        "  - Test Offline mode to verify Service Worker and PWA cache behavior.",
        "",
        "TIP: Combine with 'vitals' to measure the real performance impact.",
    ], aliases: "slow, lag, network", examples: [
        { cmd: "throttle 3g",   desc: "Slow mobile (approx 1 Mbps down)" },
        { cmd: "throttle edge", desc: "Very slow EDGE (approx 0.24 Mbps)" },
        { cmd: "throttle 4g",   desc: "Fast mobile (approx 10 Mbps)" },
        { cmd: "throttle off",  desc: "Disable throttling" },
    ]}),

    geo: () => formatHelp({ name: "geo", syntax: "[preset|lat lng]", descLines: [
        "[Requires sudo] Spoof your browser's Geolocation API coordinates.",
        "",
        "WHAT IS IT?",
        "  Overrides the coordinates returned by navigator.geolocation.",
        "  The site believes your browser is physically in a different location.",
        "",
        "REAL USE CASES:",
        "  - Test if a store locator shows the correct nearby branches.",
        "  - Check if a site geo-redirects to a different language or currency.",
        "  - Verify that GDPR and CCPA cookie banners appear when spoofing EU or CA.",
        "  - Test if local events, ads, or prices change by region.",
        "  - Validate 'near me' search results and map pins.",
        "",
        "IMPORTANT: This only spoofs the browser Geolocation API.",
        "  Your network IP does not change. Servers can still detect your",
        "  real country via IP geolocation. Use 'ip-spoof' for header-level masking.",
    ], aliases: "gps, location, spoof-geo", examples: [
        { cmd: "geo tokyo",      desc: "Spoof location to Tokyo, Japan" },
        { cmd: "geo london",     desc: "Spoof location to London, UK" },
        { cmd: "geo 48.85 2.35", desc: "Custom lat/lng coordinates (Paris)" },
        { cmd: "geo reset",      desc: "Restore your real GPS location" },
    ]}),

    "ip-spoof": () => formatHelp({ name: "ip-spoof", syntax: "[ip]", descLines: [
        "[Requires sudo] Inject fake IP headers into every HTTP request.",
        "",
        "WHAT IS IT?",
        "  Adds X-Forwarded-For, X-Real-IP, and Client-IP headers to all requests.",
        "  Some servers and WAFs trust these headers to determine the request origin,",
        "  even though your real TCP connection IP stays unchanged.",
        "",
        "REAL USE CASES:",
        "  - Test if your WAF trusts X-Forwarded-For (a known misconfiguration).",
        "  - Check if geo-blocking or rate-limiting is enforced at the header level.",
        "  - Detect if a server serves different content based on the header IP.",
        "  - Verify if your application logs the spoofed IP instead of the real one.",
        "  - Test CDN origin IP detection when sitting behind a reverse proxy.",
        "  - Bypass naive IP-based access control on dev or staging environments.",
        "",
        "IMPORTANT: This is NOT a VPN or full network tunnel.",
        "  Your real TCP/IP connection does not change. This only adds HTTP headers",
        "  that a misconfigured server might trust. Systems using real IP enforcement",
        "  (fail2ban, iptables, firewall rules) are completely unaffected.",
        "",
        "TIP: Combine with 'waf' to audit if the firewall uses header-based detection.",
    ], aliases: "fakeip, spoof-ip", examples: [
        { cmd: "ip-spoof 8.8.8.8",     desc: "Inject Google DNS IP as the origin" },
        { cmd: "ip-spoof 1.1.1.1",     desc: "Inject Cloudflare's IP" },
        { cmd: "ip-spoof 203.0.113.5", desc: "RFC 5737 documentation IP (safe for testing)" },
        { cmd: "ip-spoof reset",        desc: "Remove all injected headers" },
    ]}),
};
