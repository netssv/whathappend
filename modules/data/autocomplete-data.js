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

export const AVAILABLE_COMMANDS = [
    // DNS
    "dig", "host", "nslookup", "ttl", "dnssec", "propagation",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa",
    
    // EMAIL
    "email", "spf", "dmarc", "dkim", "deliverability",
    
    // WEB
    "web", "curl", "openssl", "whois", "hosting", "history", "rank", "ping", "trace", "robots", "links", "wayback", "green", "cookies", "pixels", "socials", "stack", "seo", "og", "alt", "schema", "minify", "load", "vitals", "security-txt",

    // AUDITS
    "audit", "sec", "csp", "waf", "hsts", "headers-check",

    // NETWORK
    "isup", "jitter", "speedtest", "rev-dns", "port-scan", "ftp-check", "ip",

    // EXTERNAL
    "ext", "blacklist", "ssllabs", "securityheaders", "whois-ext",

    // UTIL
    "start", "switch", "export", "clip", "matrix", "coffee", "sudo", "dog", "hack", "signal", "target", "tabs", "reload", "config", "about", "info", "errors", "clear", "flush", "notes", "diff", "exit", "help",

    // ALIASES
    "dns", "record", "lookup", "mail", "http", "headers", "ssl", "cert", "tls", "domain", "reg", "registrar", "provider", "webhost", "crt", "ranking", "traffic", "latency", "redirect", "follow", "sitemap", "src", "archive", "tracking", "trackers", "pixel", "ads", "social", "tech", "cms", "wappalyzer", "techstack", "meta", "tags", "thaks", "opengraph", "a11y", "images", "jsonld", "structured", "microdata", "min", "assets", "perf", "timing", "performance", "pagespeed", "cwv", "web-vitals", "core-vitals", "sec-txt", "securitytxt", "marketing", "scan", "security", "xss", "firewall", "cdn-check", "strict", "secure-transport", "hcheck", "upcheck", "down", "downcheck", "status", "latency-test", "bandwidth", "nettest", "rdns", "ptr", "ports", "nmap", "portscan", "ftp", "myip", "public-ip", "bl", "rbl", "dnsbl", "ssltest", "sheaders", "icann", "run", "go", "begin", "analyze", "actual", "current", "here", "sw", "dump", "save", "report", "tablist", "close", "tab", "restart", "reboot", "settings", "set", "prefs", "telemetry", "error", "error-list", "cls", "reset", "clearcache", "clear-cache", "note", "memo", "annotation", "quit", "ls", "commands", "man", "copy", "clipboard", "rain", "break", "pomodoro", "su", "global", "resolve", "optimiza", "optimiza-mail", "perro", "mascota", "pet", "trivia", "quiz"
];

// Commands that accept a domain parameter (for auto-filling)
export const DOMAIN_COMMANDS = [
    // DNS
    "dig", "host", "nslookup", "ttl", "dnssec",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa",
    
    // EMAIL
    "email", "spf", "dmarc", "dkim",
    
    // WEB
    "web", "curl", "openssl", "whois", "hosting", "history", "rank", "ping", "trace", "robots", "links", "wayback", "green", "cookies", "pixels", "socials", "stack", "seo", "og", "alt", "schema", "minify", "load", "vitals", "security-txt",

    // AUDITS
    "audit", "sec", "csp", "waf", "hsts", "headers-check",

    // NETWORK
    "isup", "jitter", "rev-dns", "port-scan", "ftp-check",

    // EXTERNAL
    "ext", "blacklist", "ssllabs", "securityheaders", "whois-ext",

    // UTIL
    "target", "flush", "diff", "clip",

    // ALIASES
    "dns", "record", "lookup", "mail", "http", "headers", "ssl", "cert", "tls", "domain", "reg", "registrar", "provider", "webhost", "crt", "ranking", "traffic", "latency", "redirect", "follow", "sitemap", "src", "archive", "tracking", "trackers", "pixel", "ads", "social", "tech", "cms", "wappalyzer", "techstack", "meta", "tags", "thaks", "opengraph", "a11y", "images", "jsonld", "structured", "microdata", "min", "assets", "perf", "timing", "performance", "pagespeed", "cwv", "web-vitals", "core-vitals", "sec-txt", "securitytxt", "marketing", "scan", "security", "xss", "firewall", "cdn-check", "strict", "secure-transport", "hcheck", "upcheck", "down", "downcheck", "latency-test", "bandwidth", "nettest", "rdns", "ptr", "ports", "nmap", "portscan", "ftp", "bl", "rbl", "dnsbl", "ssltest", "sheaders", "icann", "clearcache", "clear-cache"
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
const TABS_KEYS = ["list", "close", "info", "diag", "watch", "block", "sleep", "focus"];
const SPEEDTEST_KEYS = ["10", "25", "50", "90"];
export const SUBCOMMAND_MAP = {
    config:   CONFIG_KEYS,
    settings: CONFIG_KEYS,
    set:      CONFIG_KEYS,
    prefs:    CONFIG_KEYS,
    tabs:     TABS_KEYS,
    tab:      TABS_KEYS,
    speedtest: SPEEDTEST_KEYS,
    bandwidth: SPEEDTEST_KEYS,
};
