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
    const sepLen = Math.min(cols - 4, 50);
    const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

    let out = `\n  ${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset} ${ANSI.dim}${syntax}${ANSI.reset}\n`;
    out += `  ${sep}\n`;
    for (const line of descLines) {
        out += `    ${line}\n`;
    }
    if (aliases) {
        out += `    ${ANSI.dim}Aliases: ${aliases}${ANSI.reset}\n`;
    }
    out += `  ${sep}\n`;
    for (const ex of examples) {
        out += `    ${ANSI.green}${ex.cmd}${ANSI.reset}`;
        if (ex.desc) {
            out += `  ${ANSI.dim}${ex.desc}${ANSI.reset}`;
        }
        out += `\n`;
    }
    return out + "\n";
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
        dnssec:()=>formatHelp({name:"dnssec", syntax:"[domain]", descLines:["Zone Integrity Check.", "Queries DS and DNSKEY records to determine", "if the domain's DNS zone is cryptographically signed."], aliases:null, examples:[{cmd: "dnssec google.com"}]}),
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
        registrar:()=>formatHelp({name:"registrar", syntax:"[domain]", descLines:["Domain lifecycle summary.", "Shows registrar name, creation date, expiry,", "and days remaining until renewal is due."], aliases:"reg, lifecycle", examples:[{cmd: "registrar google.com"}, {cmd: "whois google.com | grep -i registrar", desc: "raw bash mapping"}]}),
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
        blacklist:()=>formatHelp({name:"blacklist", syntax:"[ip|domain]", descLines:["Check if the IP/Domain is flagged as spam.", "Generates links to MXToolbox and Spamhaus", "to verify sender reputation."], aliases:"bl, rbl, dnsbl", examples:[{cmd: "blacklist 8.8.8.8"}, {cmd: "blacklist example.com"}]}),
        ssllabs:()=>formatHelp({name:"ssllabs", syntax:"[domain]", descLines:["Qualys SSL Labs deep analysis.", "Creates a link to scan for vulnerabilities", "and grade the TLS cipher configuration."], aliases:"ssltest, ssl-labs", examples:[{cmd: "ssllabs google.com"}]}),
        securityheaders:()=>formatHelp({name:"securityheaders", syntax:"[domain]", descLines:["SecurityHeaders.com deep analysis.", "Creates a link to grade the HTTP headers", "from A+ down to F."], aliases:"sheaders, sec-headers", examples:[{cmd: "securityheaders google.com"}]}),
        "whois-ext":()=>formatHelp({name:"whois-ext", syntax:"[domain]", descLines:["External WHOIS databases.", "Provides links to ICANN and DomainTools", "for a second opinion on domain ownership."], aliases:"icann, whoisext", examples:[{cmd: "whois-ext example.com"}]}),
        target:()=>formatHelp({name:"target", syntax:"[domain|auto]", descLines:["Set or show the active target domain."], aliases:null, examples:[{cmd: "target example.com", desc: "set target"}, {cmd: "target", desc: "show current target"}, {cmd: "target auto", desc: "reset to active tab"}]}),
        about:()=>formatHelp({name:"about", syntax:"", descLines:["Philosophy and Identity.", "Modular Web Audit Tool for Infrastructure Analysts.", "Atomic Architecture, Zero-Cloud Privacy."], aliases:null, examples:[{cmd: "about"}]}),
        info:()=>formatHelp({name:"info", syntax:"", descLines:["System diagnostics and local telemetry.", "Shows extension version, Native Host connection", "status, browser engine, and session command counts."], aliases:"telemetry, status", examples:[{cmd: "info"}]}),
        clear:()=>formatHelp({name:"clear", syntax:"", descLines:["Clear terminal.", "Also: Ctrl+L"], aliases:"cls, reset", examples:[{cmd: "clear"}]}),
        help:()=>formatHelp({name:"help", syntax:"", descLines:["Command list.", "Add ? for details: email?"], aliases:"ls, commands, man, ?", examples:[{cmd: "help"}]}),
        start:()=>formatHelp({name:"start", syntax:"[domain]", descLines:["Quick-start analysis of the active tab.", "Without arguments, auto-detects the current", "browser tab and runs a progressive triage.", "With a domain argument, sets it as target", "and runs triage immediately."], aliases:"run, go, begin, analyze", examples:[{cmd: "start", desc: "(analyze active tab)"}, {cmd: "start google.com", desc: "set + analyze"}]}),
        switch:()=>formatHelp({name:"switch", syntax:"", descLines:["Switch target to the active browser tab.", "Use this when the tab-switch notification", "bar doesn't appear or was dismissed.", "Ideal for quickly re-syncing the terminal", "with the page you are currently viewing."], aliases:"actual, current, here, sw", examples:[{cmd: "switch", desc: "(adopt active tab)"}, {cmd: "actual", desc: "(same thing)"}]}),
        config:()=>formatHelp({name:"config", syntax:"[key] [value]", descLines:["View and modify user preferences.", "Settings are stored locally via", "chrome.storage.local (Zero-Cloud).", "Timeout values are capped at 10s."], aliases:"settings, set, prefs", examples:[{cmd: "config", desc: "show all settings"}, {cmd: "config timeout 5000", desc: "set 5s timeout"}, {cmd: "config auto-triage off"}, {cmd: "config expert-mode on"}, {cmd: "config reset", desc: "restore defaults"}]}),
        isup:()=>formatHelp({name:"isup", syntax:"[domain]", descLines:["Network parity check.", "Compares local reachability against a public", "uptime API to detect local blocks, ISP routing", "issues, or global outages."], aliases:"upcheck, down, downcheck, status", examples:[{cmd: "isup google.com"}, {cmd: "curl -I -s https://google.com | head -n 1", desc: "raw bash mapping"}]}),
        speed:()=>formatHelp({name:"speed", syntax:"[domain]", descLines:["Latency jitter measurement.", "Performs 5 sequential HEAD requests and", "calculates average latency and standard", "deviation (jitter). High jitter indicates", "unstable connection or congestion."], aliases:"jitter, latency-test", examples:[{cmd: "speed google.com"}, {cmd: "ping -c 10 google.com", desc: "raw bash mapping"}]}),
        speedtest:()=>formatHelp({name:"speedtest", syntax:"[size_mb]", descLines:["Local bandwidth test.", "Downloads a payload from Cloudflare's", "speed API to measure your internet download", "speed. Default size is 10MB, max is 90MB."], aliases:"bandwidth, nettest", examples:[{cmd: "speedtest"}, {cmd: "curl -o /dev/null https://speed.cloudflare...", desc: "raw bash mapping"}]}),
        ip:()=>formatHelp({name:"ip", syntax:"[domain]", descLines:["Dual-mode IP command.", "Without arguments, shows your public IP", "and ISP. With a domain, resolves A record", "and identifies the hosting provider."], aliases:"myip, public-ip", examples:[{cmd: "ip", desc: "show your public IP"}, {cmd: "ip google.com", desc: "resolve domain IP"}]}),
        "security-txt":()=>formatHelp({name:"security-txt", syntax:"[domain]", descLines:["RFC 9116 Security Contact Discovery.", "Fetches /.well-known/security.txt and", "parses Contact, Policy, and Encryption", "fields."], aliases:"sec-txt, securitytxt", examples:[{cmd: "security-txt google.com"}]}),
        vitals:()=>formatHelp({name:"vitals", syntax:"", descLines:["Core Web Vitals Scorecard.", "Extracts LCP, CLS, and INP from the", "active tab. Grades each metric against", "Google's threshold (Good/Needs Improvement/", "Poor)."], aliases:"cwv, web-vitals, core-vitals", examples:[{cmd: "vitals", desc: "(active tab)"}]}),
        flush:()=>formatHelp({name:"flush", syntax:"<domain>", descLines:["Clear cookies and cache for a domain.", "Uses chrome.browsingData scoped to the", "target origin. Requires explicit domain", "argument for safety."], aliases:"clearcache, clear-cache", examples:[{cmd: "flush example.com"}]}),
        notes:()=>formatHelp({name:"notes", syntax:"[text]", descLines:["Session annotations.", "Add analyst notes that persist in the", "session and are included in export.", "Without arguments, lists all notes."], aliases:"note, memo, annotation", examples:[{cmd: "notes Check DNS propagation"}, {cmd: "notes", desc: "list all"}]}),
        diff:()=>formatHelp({name:"diff", syntax:"<domain1> <domain2>", descLines:["Domain Comparison Utility.", "Compares DNS A records between two domains", "to identify infrastructure parity."], aliases:null, examples:[{cmd: "diff google.com bing.com"}]}),
        load:()=>formatHelp({name:"load", syntax:"[domain]", descLines:["Performance & Load Metrics.", "Uses the Navigation Timing API to fetch", "TTFB, FCP, LCP, and DOM load times.", "Provides a detailed breakdown of network timing."], aliases:"perf, performance, pagespeed, timing", examples:[{cmd: "load google.com"}]}),
        tabs:()=>formatHelp({name:"tabs", syntax:"[action]", descLines:["Tab management superpowers.", "List, close, inspect, or sleep browser tabs.", "Use 'tabs diag' to scan for performance/memory issues."], aliases:"tab, tablist", examples:[{cmd: "tabs list"}, {cmd: "tabs diag"}, {cmd: "tabs close github"}]}),
        reload:()=>formatHelp({name:"reload", syntax:"", descLines:["Extension Hard Reboot.", "Clears memory and restarts the extension context via chrome.runtime.reload().", "Useful if the background worker hangs or crashes.", "See: https://developer.chrome.com/docs/extensions/reference/runtime/#method-reload"], aliases:"restart, reboot", examples:[{cmd: "reload"}]}),
        errors:()=>formatHelp({name:"errors", syntax:"", descLines:["Error & Insight Reference Guide.", "Displays common diagnostic insights and network", "errors with explanations and resolution steps."], aliases:"error, error-list", examples:[{cmd: "errors"}]}),
    };
    if (h[resolved]) return h[resolved]();
    const suggestion = suggestCommand(cmd);
    if (suggestion) return `\n  ${ANSI.dim}No help for '${cmd}'.${ANSI.reset} ${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}\n  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
    return `\n  ${ANSI.dim}No help for '${cmd}'. Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
}
