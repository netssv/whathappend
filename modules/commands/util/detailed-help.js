/**
 * @module modules/commands/util/detailed-help.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - CMD_ALIASES from '../../data/aliases.js'
 *     - getTermCols from '../../state.js'
 * - Exports: formatHelp, sh, cmdDetailedHelp
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { CMD_ALIASES } from "../../data/aliases.js";
import { getTermCols } from "../../state.js";

// ===================================================================
//  Detailed help — cmd?
// ===================================================================

export function formatHelp(options = {}) {
    const { name, syntax, descLines = [], aliases = null, examples = [] } = options;
    const cols = getTermCols();
    const sepLen = Math.min(60, Math.max(30, cols - 4));
    const sep = ANSI.dim + "─".repeat(sepLen) + ANSI.reset;

    let out = `  ${ANSI.bgWhite}${ANSI.black} COMMAND ${ANSI.reset} ${ANSI.bold}${ANSI.cyan}${name}${ANSI.reset}\n`;
    out += `  ${sep}\n\n`;
    
    out += `  ${ANSI.bold}${ANSI.white}DESCRIPTION${ANSI.reset}\n`;
    for (const line of descLines) {
        out += `    ${line}\n`;
    }
    out += `\n`;

    out += `  ${ANSI.bold}${ANSI.white}SYNTAX${ANSI.reset}\n`;
    out += `    ${ANSI.green}${name}${ANSI.reset} ${ANSI.dim}${syntax}${ANSI.reset}\n\n`;

    if (aliases) {
        out += `  ${ANSI.bold}${ANSI.white}ALIASES${ANSI.reset}\n`;
        out += `    ${ANSI.dim}${aliases}${ANSI.reset}\n\n`;
    }

    if (examples && examples.length > 0) {
        out += `  ${ANSI.bold}${ANSI.white}EXAMPLES & USE CASES${ANSI.reset}\n`;
        for (const ex of examples) {
            out += `    ${ANSI.yellow}❯${ANSI.reset} ${ANSI.cyan}${ex.cmd}${ANSI.reset}`;
            if (ex.desc) {
                out += `\n      ${ANSI.dim}↳ ${ex.desc}${ANSI.reset}`;
            }
            out += `\n\n`;
        }
    }
    
    out += `  ${sep}\n`;
    return out;
}

export function sh(cmd, type, desc) {
    return formatHelp({
        name: cmd, syntax: "[domain]",
        descLines: [`Shortcut: dig <domain> ${type} (short)`, desc],
        aliases: null,
        examples: [{ cmd: `${cmd} example.com`, desc: "" }, { cmd: `${cmd}`, desc: "(active tab)" }]
    });
}

export function cmdDetailedHelp(cmd, suggestCommand) {
    const resolved = CMD_ALIASES[cmd] || cmd;
    const h = {
        dig:()=>formatHelp({name:"dig", syntax:"[domain] [type] [+short]", descLines:["Query the DNS system for raw records.", "Think of DNS as the phonebook of the internet.", "Types: A, AAAA, MX, TXT, NS, CNAME, SOA."], aliases:"dns, record", examples:[{cmd: "dig google.com MX"}, {cmd: "dig google.com mx +short", desc: "raw bash mapping"}]}),
        host:()=>formatHelp({name:"host", syntax:"[domain]", descLines:["Quickly find the IP address (A/AAAA) and", "Mail server (MX) for a given domain."], aliases:null, examples:[{cmd: "host google.com"}]}),
        nslookup:()=>formatHelp({name:"nslookup", syntax:"[domain]", descLines:["Identify the name servers managing a domain."], aliases:"lookup", examples:[{cmd: "nslookup google.com"}]}),
        a:()=>sh("a","A","Find the IPv4 address (where the website is hosted)."), aaaa:()=>sh("aaaa","AAAA","Find the IPv6 address."),
        mx:()=>sh("mx","MX","Mail servers (who receives emails for this domain?)."), txt:()=>sh("txt","TXT","Text records (used for SPF/security verification)."),
        ns:()=>sh("ns","NS","Nameservers (who manages the DNS settings?)."), cname:()=>sh("cname","CNAME","Domain aliases (e.g. www points to root)."),
        soa:()=>formatHelp({name:"soa", syntax:"[domain]", descLines:["Start of Authority (SOA) record.", "Contains core information about the DNS zone:", " - The primary name server.", " - The email of the domain administrator.", " - Timers for refreshing and caching (TTL).", "Useful for debugging DNS propagation issues."], aliases:null, examples:[{cmd: "soa google.com"}, {cmd: "soa", desc: "(active tab)"}]}),
        email:()=>formatHelp({name:"email", syntax:"[domain]", descLines:["Audit email deliverability & security.", "Checks if the domain can receive mail (MX),", "and verifies anti-spoofing records (SPF, DMARC,", "DKIM) to ensure emails don't go to spam."], aliases:"mail", examples:[{cmd: "email google.com"}]}),
        web:()=>formatHelp({name:"web", syntax:"[domain]", descLines:["General website health check.", "Combines IP resolution (A), server response (HTTP),", "and certificate validation (SSL) into one audit."], aliases:"audit", examples:[{cmd: "web google.com"}]}),
        sec:()=>formatHelp({name:"sec", syntax:"[domain]", descLines:["Frontend security scorecard.", "Checks if the server forces HTTPS (HSTS) and", "protects against XSS/Clickjacking using", "modern HTTP security headers."], aliases:"security, scan", examples:[{cmd: "sec google.com"}]}),
        csp:()=>formatHelp({name:"csp", syntax:"[domain]", descLines:["Content-Security-Policy analyzer.", "Fetches the CSP header and checks for XSS vulnerabilities", "(e.g., 'unsafe-inline', 'unsafe-eval', missing object-src)."], aliases:"xss", examples:[{cmd: "csp google.com"}]}),
        waf:()=>formatHelp({name:"waf", syntax:"[domain]", descLines:["Web Application Firewall detection.", "Scans HTTP headers for signatures from Cloudflare, Akamai,", "AWS CloudFront, Sucuri, Imperva, and Fastly."], aliases:"firewall, cdn-check", examples:[{cmd: "waf google.com"}]}),
        hsts:()=>formatHelp({name:"hsts", syntax:"[domain]", descLines:["HTTP Strict Transport Security (HSTS) audit.", "Verifies the max-age, includeSubDomains, and preload", "flags to ensure the site enforces HTTPS."], aliases:"strict, secure-transport", examples:[{cmd: "hsts google.com"}]}),
        "headers-check":()=>formatHelp({name:"headers-check", syntax:"[domain]", descLines:["Security Header Checklist.", "Performs a batch audit of X-Frame-Options, Referrer-Policy,", "X-Content-Type-Options, and Permissions-Policy."], aliases:"hcheck, security-headers", examples:[{cmd: "headers-check google.com"}]}),
        ttl:()=>formatHelp({name:"ttl", syntax:"[domain]", descLines:["Check DNS Time-To-Live (TTL).", "Tells you how long DNS records are cached.", "Useful to know how long a migration will take."], aliases:null, examples:[{cmd: "ttl google.com"}]}),
        spf:()=>formatHelp({name:"spf", syntax:"[domain]", descLines:["Sender Policy Framework audit.", "Checks which servers are authorized to send", "emails on behalf of this domain."], aliases:null, examples:[{cmd: "spf google.com"}]}),
        dmarc:()=>formatHelp({name:"dmarc", syntax:"[domain]", descLines:["DMARC enforcement check.", "Tells email receivers (like Gmail) what to do", "if an email fails SPF/DKIM (e.g. reject it)."], aliases:null, examples:[{cmd: "dmarc google.com"}]}),
        dkim:()=>formatHelp({name:"dkim", syntax:"[domain] [selector]", descLines:["DKIM signature scan.", "Dynamically infers selectors from MX and SPF", "records. Follow CNAME chains up to 3 levels.", "Optionally specify a manual selector to test."], aliases:null, examples:[{cmd: "dkim google.com"}, {cmd: "for sel in ...", desc: "raw bash mapping"}]}),
        deliverability:()=>formatHelp({name:"deliverability", syntax:"[domain]", descLines:["Email deliverability optimization.", "Analyzes SPF, DKIM, and DMARC configurations.", "Suggests corrections for common email delivery and spoofing issues."], aliases:"optimiza, optimiza-mail", examples:[{cmd: "deliverability google.com"}, {cmd: "optimiza mail"}]}),
        dnssec:()=>formatHelp({name:"dnssec", syntax:"[domain]", descLines:["Zone Integrity Check.", "Queries DS and DNSKEY records to determine", "if the domain's DNS zone is cryptographically signed."], aliases:null, examples:[{cmd: "dnssec google.com"}]}),
        propagation:()=>formatHelp({name:"propagation", syntax:"[domain] [type]", descLines:["Verify global DNS propagation.", "Checks multiple public DNS providers (Google, Cloudflare, Quad9)", "to ensure records have propagated globally."], aliases:"global, resolve", examples:[{cmd: "propagation google.com"}, {cmd: "propagation example.com MX"}, {cmd: "global"}]}),
        map:()=>formatHelp({name:"map", syntax:"[domain]", descLines:["Visualize the DNS resolution journey.", "Displays an ASCII map showing how the browser", "resolves the domain from Root to TLD to Authoritative NS."], aliases:"journey, flow", examples:[{cmd: "map"}, {cmd: "journey example.com"}]}),
        robots:()=>formatHelp({name:"robots", syntax:"[domain]", descLines:["Parse robots.txt to see SEO directives.", "Detects blocked paths, missing sitemaps,", "and syntax errors (like fragments)."], aliases:"sitemap", examples:[{cmd: "robots google.com"}, {cmd: "sitemap", desc: "(active tab)"}]}),
        links:()=>formatHelp({name:"links", syntax:"", descLines:["Mixed Content Scanner.", "Injects a script into the active tab to extract", "all links and highlights insecure (http://) assets."], aliases:"src", examples:[{cmd: "links", desc: "(active tab only)"}]}),
        pixels:()=>formatHelp({name:"pixels", syntax:"[domain]", descLines:["Scan website for marketing/tracking scripts.", "Detects Meta Pixel, Google Analytics, LinkedIn,", "TikTok, and 20+ other tracking platforms."], aliases:"tracking, trackers, ads", examples:[{cmd: "pixels shopify.com"}, {cmd: "curl -s https://... | grep -i google-analytics", desc: "raw mapping"}]}),
        socials:()=>formatHelp({name:"socials", syntax:"[domain]", descLines:["Detect social media presence.", "Scans the website's HTML for links to", "Facebook, Twitter, Instagram, LinkedIn, etc."], aliases:"social", examples:[{cmd: "socials google.com"}, {cmd: "curl -s https://... | grep -oE 'https?://twitter...'", desc: "raw bash mapping"}]}),
        seo:()=>formatHelp({name:"seo", syntax:"[domain]", descLines:["Baseline Search Engine Optimization check.", "Scans the HTML for Title length, Meta Description,", "and the Headings structure (H1-H6)."], aliases:"meta, tags", examples:[{cmd: "seo google.com"}, {cmd: "seo", desc: "(active tab)"}]}),
        og:()=>formatHelp({name:"og", syntax:"[domain]", descLines:["Open Graph & Social Preview scanner.", "Checks for og:title, og:image, og:description", "and twitter:card to ensure links look good on social media."], aliases:"thaks, opengraph, cards", examples:[{cmd: "og example.com"}, {cmd: "og", desc: "(active tab)"}]}),
        alt:()=>formatHelp({name:"alt", syntax:"[domain]", descLines:["Image Accessibility Scanner.", "Checks all <img> tags in the DOM for missing", "or empty alt attributes."], aliases:"images, a11y", examples:[{cmd: "alt example.com"}, {cmd: "alt", desc: "(active tab)"}]}),
        schema:()=>formatHelp({name:"schema", syntax:"[domain]", descLines:["Structured Data Scanner.", "Extracts JSON-LD blocks and Microdata to verify", "search engine visibility."], aliases:"structured, jsonld, microdata", examples:[{cmd: "schema google.com"}, {cmd: "schema", desc: "(active tab)"}]}),
        minify:()=>formatHelp({name:"minify", syntax:"[domain]", descLines:["Asset Minification Audit.", "Scans the DOM for .js and .css files that are", "missing the '.min' suffix."], aliases:"min, assets", examples:[{cmd: "minify google.com"}, {cmd: "minify", desc: "(active tab)"}]}),
        stack:()=>formatHelp({name:"stack", syntax:"[domain]", descLines:["Detect website technology stack.", "Finds CMS (WordPress, Shopify), Frameworks", "(React, Vue), and Servers (Nginx, Cloudflare)."], aliases:"tech, cms, wappalyzer, techstack", examples:[{cmd: "stack google.com"}, {cmd: "curl -I -s ... | grep -i wappalyzer", desc: "raw bash mapping"}]}),
        curl:()=>formatHelp({name:"curl", syntax:"[url]", descLines:["Fetch raw HTTP headers from the server.", "Useful to see the exact server response code", "(200, 404, 500) and security configurations."], aliases:"http, headers", examples:[{cmd: "curl google.com"}]}),
        openssl:()=>formatHelp({name:"openssl", syntax:"[domain]", descLines:["Inspect the SSL/TLS Certificate.", "Verifies who issued the cert, when it expires,", "and if the HTTPS connection is secure."], aliases:"ssl, cert, tls", examples:[{cmd: "openssl google.com"}]}),
        whois:()=>formatHelp({name:"whois", syntax:"[domain]", descLines:["Domain Registration Data (RDAP/WHOIS).", "Shows who owns the domain, where it was", "registered, and when it expires."], aliases:"domain", examples:[{cmd: "whois google.com"}]}),

        hosting:()=>formatHelp({name:"hosting", syntax:"[domain|ip]", descLines:["Identify the web hosting provider.", "Resolves A record → IP → RDAP to find", "who is hosting the website (e.g. AWS, Cloudflare)."], aliases:"provider, webhost, hoster", examples:[{cmd: "hosting google.com"}, {cmd: "whois google.com | grep -i orgname", desc: "raw bash mapping"}]}),
        history:()=>formatHelp({name:"history", syntax:"[domain]", descLines:["Fetch Certificate Transparency logs.", "Extracts first and last infrastructure footprint."], aliases:"crt", examples:[{cmd: "history shopify.com"}]}),
        rank:()=>formatHelp({name:"rank", syntax:"[domain]", descLines:["Global web traffic ranking (Tranco).", "Provides the global traffic rank for the domain,", "as well as the 30-day trend. (Replaces Alexa Rank)"], aliases:"ranking, traffic", examples:[{cmd: "rank google.com"}]}),
        wayback:()=>formatHelp({name:"wayback", syntax:"[domain]", descLines:["Check Archive.org for temporal persistence.", "Returns the last date the domain was seen online."], aliases:"archive", examples:[{cmd: "wayback shopify.com"}]}),
        green:()=>formatHelp({name:"green", syntax:"[domain]", descLines:["Environmental Check.", "Queries The Green Web Foundation to see if", "the domain is hosted on green energy."], aliases:null, examples:[{cmd: "green google.com"}, {cmd: "curl -s https://api.thegreenwebfoundation.org...", desc: "raw bash mapping"}]}),
        cookies:()=>formatHelp({name:"cookies", syntax:"[domain]", descLines:["Privacy Audit.", "Extracts session and tracking cookies.", "Flags session cookies missing the HttpOnly attribute."], aliases:null, examples:[{cmd: "cookies google.com"}, {cmd: "curl -I -s https://google.com | grep -i set-cookie", desc: "raw bash mapping"}]}),
        ping:()=>formatHelp({name:"ping", syntax:"[domain]", descLines:["Test server responsiveness (latency).", "Sends 4 HTTPS requests to see how fast", "the server responds in milliseconds."], aliases:"latency", examples:[{cmd: "ping google.com"}]}),
        trace:()=>formatHelp({name:"trace", syntax:"[url]", descLines:["Follow URL redirect chains.", "Great for debugging infinite redirect loops,", "or seeing where a shortlink goes."], aliases:"redirect, follow, traceroute", examples:[{cmd: "trace google.com"}]}),
        "rev-dns":()=>formatHelp({name:"rev-dns", syntax:"[ip]", descLines:["Reverse DNS lookup (PTR record).", "Given an IP address, this finds the domain", "name and hosting provider behind it."], aliases:"rdns, ptr, reverse-dns", examples:[{cmd: "rev-dns 8.8.8.8"}]}),
        "port-scan":()=>formatHelp({name:"port-scan", syntax:"[domain] [ports]", descLines:["Scan for open network ports.", "Finds if services like SSH (22), FTP (21),", "or Databases (3306) are exposed to the public."], aliases:"ports, nmap, portscan", examples:[{cmd: "port-scan google.com"}, {cmd: "nc -z -v -w2 google.com 80 443", desc: "raw bash mapping"}]}),
        "ftp-check":()=>formatHelp({name:"ftp-check", syntax:"[domain]", descLines:["Check if an insecure FTP server is running.", "Attempts to grab the FTP banner to identify", "the server software version."], aliases:"ftp", examples:[{cmd: "ftp-check example.com"}, {cmd: "nc -v -w5 example.com 21", desc: "raw bash mapping"}]}),
        "export":()=>formatHelp({name:"export", syntax:"[json|csv]", descLines:["Save your terminal session.", "Exports all commands and insights into a", "file you can share with your team."], aliases:"dump, report, save", examples:[{cmd: "export json"}, {cmd: "export csv"}]}),
        audit:()=>formatHelp({name:"audit", syntax:"[domain]", descLines:["Marketing Suite.", "Runs SEO, OpenGraph, Accessibility, and", "Schema analysis sequentially."], aliases:"marketing", examples:[{cmd: "audit google.com"}]}),
        ext:()=>formatHelp({name:"ext", syntax:"<ssl|bl|headers|whois> [domain]", descLines:["External Tool Consolidation.", "Generates links to industry-standard external", "analysis tools."], aliases:"-", examples:[{cmd: "ext ssl google.com"}, {cmd: "ext bl google.com"}]}),
        target:()=>formatHelp({name:"target", syntax:"[domain|auto]", descLines:["Set or show the active target domain."], aliases:null, examples:[{cmd: "target example.com", desc: "set target"}, {cmd: "target", desc: "show current target"}, {cmd: "target auto", desc: "reset to active tab"}]}),
        about:()=>formatHelp({name:"about", syntax:"", descLines:["Philosophy and Identity.", "Modular Web Audit Tool for Infrastructure Analysts.", "Atomic Architecture, Zero-Cloud Privacy."], aliases:null, examples:[{cmd: "about"}]}),
        info:()=>formatHelp({name:"info", syntax:"", descLines:["System diagnostics and local telemetry.", "Shows extension version, Native Host connection", "status, browser engine, and session command counts."], aliases:"telemetry, status", examples:[{cmd: "info"}]}),
        clear:()=>formatHelp({name:"clear", syntax:"", descLines:["Clear terminal.", "Also: Ctrl+L"], aliases:"cls, reset", examples:[{cmd: "clear"}]}),
        help:()=>formatHelp({name:"help", syntax:"", descLines:["Command list.", "Add ? for details: email?"], aliases:"ls, commands, man, ?", examples:[{cmd: "help"}]}),
        start:()=>formatHelp({name:"start", syntax:"[domain]", descLines:["Quick-start analysis of the active tab.", "Without arguments, auto-detects the current", "browser tab and runs a progressive triage.", "With a domain argument, sets it as target", "and runs triage immediately."], aliases:"run, go, begin, analyze", examples:[{cmd: "start", desc: "(analyze active tab)"}, {cmd: "start google.com", desc: "set + analyze"}]}),
        switch:()=>formatHelp({name:"switch", syntax:"", descLines:["Switch target to the active browser tab.", "Use this when the tab-switch notification", "bar doesn't appear or was dismissed.", "Ideal for quickly re-syncing the terminal", "with the page you are currently viewing."], aliases:"actual, current, here, sw", examples:[{cmd: "switch", desc: "(adopt active tab)"}, {cmd: "actual", desc: "(same thing)"}]}),
        config:()=>formatHelp({name:"config", syntax:"[key] [value]", descLines:["View and modify user preferences.", "Settings are stored locally via", "chrome.storage.local (Zero-Cloud).", "Timeout values are capped at 10s."], aliases:"settings, set, prefs", examples:[{cmd: "config", desc: "show all settings"}, {cmd: "config timeout 5000", desc: "set 5s timeout"}, {cmd: "config auto-triage off"}, {cmd: "config expert-mode on"}, {cmd: "config reset", desc: "restore defaults"}]}),
        isup:()=>formatHelp({name:"isup", syntax:"[domain]", descLines:["Network parity check.", "Compares local reachability against a public", "uptime API to detect local blocks, ISP routing", "issues, or global outages."], aliases:"upcheck, down, downcheck, status", examples:[{cmd: "isup google.com"}, {cmd: "curl -I -s https://google.com | head -n 1", desc: "raw bash mapping"}]}),
        jitter:()=>formatHelp({name:"jitter", syntax:"[domain]", descLines:["Latency jitter measurement.", "Performs 5 sequential HEAD requests and", "calculates average latency and standard", "deviation (jitter). High jitter indicates", "unstable connection or congestion."], aliases:"speed, latency-test", examples:[{cmd: "jitter google.com"}, {cmd: "ping -c 10 google.com", desc: "raw bash mapping"}]}),
        speedtest:()=>formatHelp({name:"speedtest", syntax:"[size_mb]", descLines:["Local bandwidth test.", "Downloads a payload from Cloudflare's", "speed API to measure your internet download", "speed. Default size is 10MB, max is 90MB."], aliases:"bandwidth, nettest", examples:[{cmd: "speedtest"}, {cmd: "curl -o /dev/null https://speed.cloudflare...", desc: "raw bash mapping"}]}),
        ip:()=>formatHelp({name:"ip", syntax:"[domain]", descLines:["Dual-mode IP command.", "Without arguments, shows your public IP", "and ISP. With a domain, resolves A record", "and identifies the hosting provider."], aliases:"myip, public-ip", examples:[{cmd: "ip", desc: "show your public IP"}, {cmd: "ip google.com", desc: "resolve domain IP"}]}),
        "security-txt":()=>formatHelp({name:"security-txt", syntax:"[domain]", descLines:["RFC 9116 Security Contact Discovery.", "Fetches /.well-known/security.txt and", "parses Contact, Policy, and Encryption", "fields."], aliases:"sec-txt, securitytxt", examples:[{cmd: "security-txt google.com"}]}),
        vitals:()=>formatHelp({name:"vitals", syntax:"", descLines:["Core Web Vitals Scorecard.", "Extracts LCP, CLS, and INP from the", "active tab. Grades each metric against", "Google's threshold (Good/Needs Improvement/", "Poor)."], aliases:"cwv, web-vitals, core-vitals", examples:[{cmd: "vitals", desc: "(active tab)"}]}),
        flush:()=>formatHelp({name:"flush", syntax:"<domain>", descLines:["Clear cookies and cache for a domain.", "Uses chrome.browsingData scoped to the", "target origin. Requires explicit domain", "argument for safety."], aliases:"clearcache, clear-cache", examples:[{cmd: "flush example.com"}]}),
        diff:()=>formatHelp({name:"diff", syntax:"<domain1> <domain2>", descLines:["Domain Comparison Utility.", "Compares DNS A records between two domains", "to identify infrastructure parity."], aliases:null, examples:[{cmd: "diff google.com bing.com"}]}),
        edit:()=>formatHelp({name:"edit", syntax:"[--test]", descLines:["Toggle Live Design Mode.", "Enables document.designMode on the active tab,", "allowing you to click anywhere and type to", "modify text visually. Great for mockups."], aliases:"designmode, modify", examples:[{cmd: "edit"}, {cmd: "edit --test"}]}),
        load:()=>formatHelp({name:"load", syntax:"[domain]", descLines:["Performance & Load Metrics.", "Uses the Navigation Timing API to fetch", "TTFB, FCP, LCP, and DOM load times.", "Provides a detailed breakdown of network timing."], aliases:"perf, performance, pagespeed, timing", examples:[{cmd: "load google.com"}]}),
        tabs:()=>formatHelp({name:"tabs", syntax:"[action]", descLines:["Tab management superpowers.", "List, close, inspect, flush, or sleep browser tabs.", "Use 'tabs diag' to scan for performance/memory issues.", "Use 'tabs watch' to live-monitor a specific tab.", "Use 'tabs flush' to clear cookies/cache for a tab."], aliases:"tab, tablist", examples:[{cmd: "tabs list"}, {cmd: "tabs diag"}, {cmd: "tabs close github"}, {cmd: "tabs flush 1"}]}),
        reload:()=>formatHelp({name:"reload", syntax:"", descLines:["Extension Hard Reboot.", "Clears memory and restarts the extension context via chrome.runtime.reload().", "Useful if the background worker hangs or crashes.", "See: https://developer.chrome.com/docs/extensions/reference/runtime/#method-reload"], aliases:"restart, reboot", examples:[{cmd: "reload"}]}),
        refresh:()=>formatHelp({name:"refresh", syntax:"", descLines:["Reloads the active browser tab.", "Performs a standard page refresh (like pressing F5).", "Useful for applying network block rules or testing modifications."], aliases:"f5, ref", examples:[{cmd: "refresh"}, {cmd: "f5"}]}),
        useragent:()=>formatHelp({name:"useragent", syntax:"[preset]", descLines:["[Requires sudo] Overrides the browser's User-Agent string.", "Useful for testing how a site renders for different browsers.", "Use 'ua reset' to restore default agent."], aliases:"ua, agent, spoof", examples:[{cmd: "ua chrome"}, {cmd: "ua safari"}, {cmd: "ua reset"}]}),
        mobile:()=>formatHelp({name:"mobile", syntax:"[preset]", descLines:["[Requires sudo] Emulates a mobile device environment.", "Overrides User-Agent and viewport dimensions.", "Use 'mobile reset' to restore desktop view."], aliases:"mob, responsive, iphone", examples:[{cmd: "mobile iphone"}, {cmd: "mobile android"}, {cmd: "mobile reset"}]}),
        throttle:()=>formatHelp({name:"throttle", syntax:"[preset]", descLines:["[Requires sudo] Emulates network speed limitations.", "Simulates conditions like 3G, 4G, or Offline mode.", "Use 'throttle off' to disable."], aliases:"slow, lag, network", examples:[{cmd: "throttle 3g"}, {cmd: "throttle edge"}, {cmd: "throttle off"}]}),
        geo:()=>formatHelp({name:"geo", syntax:"[preset|lat lng]", descLines:["[Requires sudo] Spoofs HTML5 Geolocation API coordinates.", "Overrides navigator.geolocation via debugger protocol.", "Note: This is NOT IP spoofing. Your network IP remains unchanged.", "Use 'geo reset' to restore your real location."], aliases:"gps, location, spoof-geo", examples:[{cmd: "geo tokyo"}, {cmd: "geo 48.85 2.35"}, {cmd: "geo reset"}]}),
        "ip-spoof":()=>formatHelp({name:"ip-spoof", syntax:"[ip]", descLines:["[Requires sudo] Injects fake IP headers (X-Forwarded-For, etc).", "Tricks servers or WAFs into thinking the request comes from a different IP.", "Does NOT change your actual TCP connection IP (Not a VPN).", "Use 'ip-spoof reset' to clear the headers."], aliases:"fakeip, spoof-ip", examples:[{cmd: "ip-spoof 8.8.8.8"}, {cmd: "ip-spoof reset"}]}),
        errors:()=>formatHelp({name:"errors", syntax:"", descLines:["Error & Insight Reference Guide.", "Displays common diagnostic insights and network", "errors with explanations and resolution steps."], aliases:"error, error-list", examples:[{cmd: "errors"}]}),
        clip:()=>formatHelp({name:"clip", syntax:"[domain|target]", descLines:["Copy session to clipboard as Markdown.", "Without arguments, copies the full session.", "With a domain, copies only entries related", "to that specific target.", "Use 'target' to auto-filter by active domain.", "Ready to paste into tickets, docs, or chat."], aliases:"copy, clipboard", examples:[{cmd: "clip", desc: "full session"}, {cmd: "clip target", desc: "current target only"}, {cmd: "clip google.com", desc: "filter by domain"}]}),
        matrix:()=>formatHelp({name:"matrix", syntax:"", descLines:["Activate code rain visual effect.", "Renders a canvas overlay with cascading", "katakana and hex glyphs for ~6 seconds.", "Uses the current theme's accent color."], aliases:"rain", examples:[{cmd: "matrix"}]}),
        coffee:()=>formatHelp({name:"coffee", syntax:"[minutes]", descLines:["Pomodoro break timer.", "Displays a live-updating ASCII coffee cup", "that drains over the specified duration.", "Sends a browser notification when complete.", "Press Ctrl+C to cancel the timer early."], aliases:"break, pomodoro", examples:[{cmd: "coffee", desc: "5-min micro-break"}, {cmd: "coffee 25", desc: "25-min session"}, {cmd: "pomodoro 15"}]}),
        dog:()=>formatHelp({name:"dog", syntax:"", descLines:["Dynamic dog animation.", "Displays an ASCII animation of two dogs playing", "across the terminal. Clears the screen and includes", "a human reminder to walk your pet.", "Press Ctrl+C to stop."], aliases:"perro, mascota, pet", examples:[{cmd: "dog"}, {cmd: "perro"}]}),
        snake:()=>formatHelp({name:"snake", syntax:"", descLines:["Play a classic game of Snake.", "Takes over the terminal interface and allows you to play.", "Use WASD or Arrow Keys to move.", "Press Q to quit or R to restart after game over."], aliases:"juego, game, play", examples:[{cmd: "snake"}, {cmd: "play"}]}),
        hack:()=>formatHelp({name:"hack", syntax:"[level] [--timer]", descLines:["Technical trivia simulation.", "A 10-question multiple-choice quiz covering", "DNS, HTTP, SEO, Web Security, and Recon.", "Supports 4 difficulty levels: junior, mid, senior, random.", "Use --timer to enable a 15-second countdown per question."], aliases:"trivia, quiz", examples:[{cmd: "hack"}, {cmd: "hack random --timer"}, {cmd: "trivia mid"}]}),
        sudo:()=>formatHelp({name:"sudo", syntax:"", descLines:["Gain administrative access.", "Outputs a witty message about administrative privileges."], aliases:"su", examples:[{cmd: "sudo"}, {cmd: "su"}]}),
        block:()=>formatHelp({name:"block", syntax:"[pattern]", descLines:["Block network requests via CDP.", "Intercepts and drops network requests matching", "a wildcard pattern (e.g. *.js, *analytics*).", "Use --list to view blocks, --clear to reset."], aliases:"ban, deny, drop", examples:[{cmd: "block *.png"}, {cmd: "block --list"}, {cmd: "block --clear"}]}),
        fonts:()=>formatHelp({name:"fonts", syntax:"[--test]", descLines:["List all loaded web fonts.", "Injects a script to evaluate document.fonts", "and parses CSS to list all loaded web fonts on", "the active tab."], aliases:"typography, type", examples:[{cmd: "fonts"}, {cmd: "fonts --test"}]}),
        palette:()=>formatHelp({name:"palette", syntax:"[--test]", descLines:["Extract color palette.", "Parses the active tab's stylesheets and inline", "styles to extract and list the most frequently", "used hex/RGB colors."], aliases:"colors, theme", examples:[{cmd: "palette"}, {cmd: "palette --test"}]}),
        comments:()=>formatHelp({name:"comments", syntax:"[--test]", descLines:["Extract hidden HTML/JS comments.", "Parses the active tab's DOM and inline scripts", "to extract comments, filtering out standard", "library noise. Highlights keywords like TODO."], aliases:"hidden, notes, note, memo, annotation", examples:[{cmd: "comments"}, {cmd: "comments --test"}]}),
        cms:()=>formatHelp({name:"cms", syntax:"[--test]", descLines:["CMS Fingerprinting.", "Analyzes the active tab's DOM, meta tags,", "and script/link paths to identify the underlying", "Content Management System, its version, and plugins."], aliases:"wordpress, fingerprint", examples:[{cmd: "cms"}, {cmd: "cms --test"}]}),
        emails:()=>formatHelp({name:"emails", syntax:"[--test]", descLines:["Email Address Extractor.", "Scans the active tab's entire DOM to find", "and deduplicate email addresses. Ignores", "common traps like image extensions."], aliases:"scrape-emails, contacts", examples:[{cmd: "emails"}, {cmd: "emails --test"}]}),
        phones:()=>formatHelp({name:"phones", syntax:"[--test]", descLines:["Phone Number Extractor.", "Scans the active tab's DOM for tel: links", "and formats matching international or", "standard domestic phone numbers."], aliases:"scrape-phones, numbers", examples:[{cmd: "phones"}, {cmd: "phones --test"}]}),
        malware:()=>formatHelp({name:"malware", syntax:"[--test]", descLines:["Client-Side Heuristic Scan.", "Performs a security scan on the active tab's DOM", "to detect hidden iframes, heavily obfuscated", "JavaScript, and cryptominers."], aliases:"virus, heuristics", examples:[{cmd: "malware"}, {cmd: "malware --test"}]}),
        fullscreen:()=>formatHelp({name:"fullscreen", syntax:"", descLines:["Toggle window fullscreen state.", "Uses Chrome's native window API to enter", "or exit fullscreen mode (like pressing F11)."], aliases:"fs, f11", examples:[{cmd: "fullscreen"}, {cmd: "f11"}]}),
        watch:()=>formatHelp({name:"watch", syntax:"[waterfall|raw]", descLines:["Live network activity monitor.", "Default: aggregated dashboard metrics (heap, DOM, page weight).", "'watch waterfall': graphical waterfall with timing bars.", "'watch raw': streaming log of full URLs as they load."], aliases:"monitor, live, netwatch", examples:[{cmd: "watch", desc: "dashboard metrics"}, {cmd: "watch waterfall", desc: "graphical waterfall"}, {cmd: "watch raw", desc: "raw request stream"}]}),
        extract:()=>formatHelp({name:"extract", syntax:"<flag>", descLines:["Unified page content extractor.", "Consolidates all scraping operations under one command.", "Flags: -emails, -phones, -links, -images, -docs, -comments.", "Links and document results are rendered as clickable hyperlinks."], aliases:null, examples:[{cmd: "extract -emails"}, {cmd: "extract -links"}, {cmd: "extract -images"}, {cmd: "extract -docs"}, {cmd: "extract", desc: "show all flags"}]}),
    };
    if (h[resolved]) return h[resolved]();
    const suggestion = suggestCommand(cmd);
    if (suggestion) return `\n  ${ANSI.dim}No help for '${cmd}'.${ANSI.reset} ${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}\n  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
    return `\n  ${ANSI.dim}No help for '${cmd}'. Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
}
