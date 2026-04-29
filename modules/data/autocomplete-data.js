// ===================================================================
// Autocomplete Data
// ===================================================================

export const AVAILABLE_COMMANDS = [
    "dig", "host", "nslookup", "curl", "openssl", "whois",
    "ping", "trace", "target",
    "email", "web", "sec", "ttl", "spf", "dmarc", "dkim", "robots",
    "registrar", "hosting", "history",
    "help",    "history", "crt", "wayback", "archive", "green", "cookies", "about", "info", "exit",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa", "dnssec",
    "rev-dns", "port-scan", "ftp-check", "export",
    "blacklist", "ssllabs", "securityheaders", "whois-ext",
    // aliases
    "dns", "ssl", "headers", "redirect", "security",
    "cls", "reset", "ls", "commands", "man",
    "http", "cert", "tls", "traceroute", "follow",
    "lookup", "scan", "audit", "mail", "domain",
    "latency", "sitemap", "record",
    "rdns", "ptr", "ports", "nmap", "portscan", "ftp",
    "bl", "rbl", "dnsbl", "ssltest", "sheaders", "icann",
    "dump", "report", "save",
    "pixels", "tracking", "trackers", "pixel", "ads", "links",
    "stack", "tech", "techstack", "wappalyzer", "cms",
    "load", "perf", "performance", "pagespeed", "timing",
    "reg", "lifecycle",
    "hoster", "provider", "webhost",
    "switch", "sw", "actual", "current", "here",
    "start", "run", "go", "begin", "analyze",
    "config", "settings", "set", "prefs",
    "tabs", "tablist", "close", "tab",
    "isup", "upcheck", "down", "downcheck", "status",
    "speed", "jitter", "latency-test",
    "speedtest", "bandwidth", "nettest",
    "ip", "myip", "public-ip",
    "security-txt", "sec-txt", "securitytxt",
    "vitals", "cwv", "web-vitals", "core-vitals",
    "flush", "clearcache", "clear-cache",
    "notes", "note", "memo", "annotation",
    "clear", "errors", "error", "error-list", "quit",
    "load",
];

// Commands that accept a domain parameter (for auto-filling)
export const DOMAIN_COMMANDS = [
    "dig", "host", "nslookup", "curl", "openssl", "whois",
    "ping", "trace",
    "email", "web", "sec", "ttl", "spf", "dmarc", "dkim", "robots",
    "registrar", "hosting", "history", "wayback", "green", "cookies",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa", "dnssec",
    "rev-dns", "port-scan", "ftp-check",
    "blacklist", "ssllabs", "securityheaders", "whois-ext",
    // aliases
    "dns", "ssl", "headers", "redirect", "security",
    "http", "cert", "tls", "traceroute", "follow",
    "lookup", "scan", "audit", "mail", "domain",
    "latency", "sitemap", "record",
    "rdns", "ptr", "ports", "nmap", "portscan", "ftp",
    "bl", "rbl", "ssltest", "sheaders", "icann",
    "pixels", "tracking", "trackers", "pixel", "ads",
    "stack", "tech", "techstack", "wappalyzer", "cms",
    "load", "perf", "performance", "pagespeed", "timing",
    "reg", "lifecycle",
    "hoster", "provider", "webhost",
    "isup", "upcheck", "down", "downcheck", "status",
    "speed", "jitter", "latency-test",
    "speedtest", "bandwidth", "nettest",
    "ip", "myip", "public-ip",
    "security-txt", "sec-txt", "securitytxt",
    "vitals", "cwv", "web-vitals", "core-vitals",
    "flush", "clearcache", "clear-cache",
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
export const CONFIG_KEYS = ["timeout", "retry-timeout", "auto-triage", "tab-notify", "auto-hide", "expert-mode", "reset", "list"];
const TABS_KEYS = ["list", "close", "info", "diag", "watch", "block", "sleep", "focus"];
export const SUBCOMMAND_MAP = {
    config:   CONFIG_KEYS,
    settings: CONFIG_KEYS,
    set:      CONFIG_KEYS,
    prefs:    CONFIG_KEYS,
    tabs:     TABS_KEYS,
    tab:      TABS_KEYS,
};
