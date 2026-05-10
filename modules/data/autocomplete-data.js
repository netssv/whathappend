/**
 * @module modules/data/autocomplete-data.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: AVAILABLE_COMMANDS, DOMAIN_COMMANDS, RAW_SNIPPETS, CONFIG_KEYS, SUBCOMMAND_MAP
 * - Layer: Data Layer - Static constants, dictionaries, and autocomplete datasets.
 */

// ===================================================================
// Autocomplete Data
// ===================================================================

import { HELP_SECTIONS } from "./help-data.js";

const commandSet = new Set();
HELP_SECTIONS.forEach(sec => {
    sec.cmds.forEach(cmdRow => {
        // First word of command (e.g. "dns -a" -> "dns")
        const cmdName = cmdRow[0].split(" ")[0];
        commandSet.add(cmdName);
        
        // Add aliases
        if (cmdRow[2]) {
            cmdRow[2].split(" ").forEach(alias => {
                if (alias && !alias.startsWith("-") && !alias.startsWith("<")) {
                    commandSet.add(alias);
                }
            });
        }
    });
});

export const AVAILABLE_COMMANDS = Array.from(commandSet);

// Commands that accept a domain parameter (for auto-filling)
export const DOMAIN_COMMANDS = [
    // DNS
    "dig", "host", "nslookup", "ttl", "dnssec",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa", "map",
    
    // EMAIL
    "email", "spf", "dmarc", "dkim",
    
    // WEB
    "web", "curl", "openssl", "whois", "hosting", "history", "rank", "ping", "trace", "robots", "links", "wayback", "green", "cookies", "pixels", "socials", "stack", "minify", "load", "vitals", "security-txt", "fonts", "palette",

    // AUDITS
    "sec", "csp", "waf", "hsts", "headers-check", "comments", "cms", "malware",

    // NETWORK
    "isup", "jitter", "rev-dns", "port-scan", "ftp-check",

    // EXTERNAL
    "ext", "blacklist", "ssllabs", "securityheaders", "whois-ext",

    // UTIL
    "target", "flush", "diff", "clip", "edit",

    // ALIASES
    "dns", "record", "lookup", "mail", "http", "headers", "ssl", "cert", "tls", "domain", "reg", "registrar", "provider", "webhost", "crt", "ranking", "traffic", "latency", "redirect", "follow", "forwarding", "sitemap", "src", "archive", "tracking", "trackers", "pixel", "ads", "social", "tech", "wappalyzer", "techstack", "meta", "tags", "thaks", "opengraph", "a11y", "images", "jsonld", "structured", "microdata", "min", "assets", "perf", "timing", "performance", "pagespeed", "cwv", "web-vitals", "core-vitals", "sec-txt", "securitytxt", "marketing", "scan", "security", "xss", "firewall", "cdn-check", "strict", "secure-transport", "hcheck", "upcheck", "down", "downcheck", "latency-test", "bandwidth", "nettest", "rdns", "ptr", "ports", "nmap", "portscan", "ftp", "bl", "rbl", "dnsbl", "ssltest", "sheaders", "icann", "clearcache", "clear-cache", "wordpress", "fingerprint", "virus", "heuristics", "designmode", "modify", "scrape-emails", "contacts", "scrape-phones", "numbers", "journey", "flow", "dns-map", "path"
];

// Raw Bash Educational Snippets
export const RAW_SNIPPETS = [
    "curl -I -s https://",
    "curl -w \"\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n\" -o /dev/null -s https://",
    "curl -s https://api.thegreenwebfoundation.org/greencheck/",
    "curl -s \"https://crt.sh/?q=",
    "curl -o /dev/null https://speed.cloudflare.com/__down?bytes=10485760",
    "curl -I -s https://", // cookies prefix
    "ping -c 10 ",
    "ping -c 4 ",
    "whois ",
    "dig ",
    "nc -z -v -w2 ",
    "nc -v -w5 ",
    "for sel in "
];

// Context-aware subcommand completion (keys scoped to their parent command only)
export const CONFIG_KEYS = ["timeout", "retry-timeout", "auto-triage", "tab-notify", "autoHide", "autoHideDelay", "expert-mode", "theme", "reset", "list"];
const TABS_KEYS = ["-list", "-close", "-info", "-diag", "-watch", "-block", "-sleep", "-focus", "-flush"];
const WATCH_KEYS = ["raw", "waterfall", "log", "stream"];
const SPEEDTEST_KEYS = ["10", "25", "50", "90"];
const UA_KEYS = ["reset", "clear", "off"];
const MOBILE_KEYS = ["reset", "off", "desktop"];
const THROTTLE_KEYS = ["5g", "4g", "fast3g", "slow3g", "edge", "offline", "reset", "off", "none", "disable"];
const GEO_KEYS = ["london", "nyc", "india", "tokyo", "mexico", "brazil", "italy", "philippines", "add", "remove", "list", "reset", "clear", "off"];
const BLOCK_KEYS = ["--list", "--clear", "list", "clear"];
const HACK_KEYS = ["junior", "mid", "senior", "random", "--timer"];
const EXTRACT_KEYS = ["-emails", "-phones", "-links", "-images", "-docs", "-comments"];
const WEB_KEYS = ["-full", "-audit", "-seo", "-og", "-schema", "-alt"];
const DNS_KEYS = ["-a", "-aaaa", "-mx", "-txt", "-ns", "-cname", "-soa"];
const HELP_KEYS = ["-audit", "-dns", "-email", "-web", "-net", "-ext", "-util"];
const COOKIES_KEYS = ["-persist", "-keepalive", "-stop"];
const SUDO_KEYS = ["-l", "--list"];
const SESSION_KEYS = ["list", "close"];
const IPSPOOF_KEYS = ["reset", "clear", "off", "1.1.1.1", "8.8.8.8", "127.0.0.1"];

export const SUBCOMMAND_MAP = {
    config:   CONFIG_KEYS,
    settings: CONFIG_KEYS,
    set:      CONFIG_KEYS,
    prefs:    CONFIG_KEYS,
    tabs:     TABS_KEYS,
    tab:      TABS_KEYS,
    speedtest: SPEEDTEST_KEYS,
    bandwidth: SPEEDTEST_KEYS,
    useragent: UA_KEYS,
    ua:        UA_KEYS,
    agent:     UA_KEYS,
    spoof:     UA_KEYS,
    mobile:    MOBILE_KEYS,
    mob:       MOBILE_KEYS,
    responsive: MOBILE_KEYS,
    iphone:    MOBILE_KEYS,
    throttle:  THROTTLE_KEYS,
    slow:      THROTTLE_KEYS,
    lag:       THROTTLE_KEYS,
    network:   THROTTLE_KEYS,
    geo:       GEO_KEYS,
    gps:       GEO_KEYS,
    location:  GEO_KEYS,
    block:     BLOCK_KEYS,
    ban:       BLOCK_KEYS,
    deny:      BLOCK_KEYS,
    drop:      BLOCK_KEYS,
    hack:      HACK_KEYS,
    trivia:    HACK_KEYS,
    quiz:      HACK_KEYS,
    watch:     WATCH_KEYS,
    monitor:   WATCH_KEYS,
    live:      WATCH_KEYS,
    netwatch:  WATCH_KEYS,
    extract:   EXTRACT_KEYS,
    web:       WEB_KEYS,
    dns:       DNS_KEYS,
    help:      HELP_KEYS,
    cookies:   COOKIES_KEYS,
    sudo:      SUDO_KEYS,
    su:        SUDO_KEYS,
    session:   SESSION_KEYS,
    "ip-spoof": IPSPOOF_KEYS,
    fakeip:     IPSPOOF_KEYS,
    "spoof-ip": IPSPOOF_KEYS,
};
