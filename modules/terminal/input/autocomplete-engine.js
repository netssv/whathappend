import { InputEvents } from "./events.js";
import { ContextManager } from "../../context.js";

function getLongestCommonPrefix(words) {
    if (!words || words.length === 0) return "";
    let prefix = words[0];
    for (let i = 1; i < words.length; i++) {
        while (words[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === "") return "";
        }
    }
    return prefix;
}

const AVAILABLE_COMMANDS = [
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
    "switch", "sw", "tab",
    "start", "run", "go", "begin", "analyze",
    "config", "settings", "set", "prefs",
    "isup", "upcheck", "down", "downcheck", "status",
    "speed", "jitter", "latency-test",
    "speedtest", "bandwidth", "nettest",
    "ip", "myip", "public-ip",
    "security-txt", "sec-txt", "securitytxt",
    "vitals", "cwv", "web-vitals", "core-vitals",
    "flush", "clearcache", "clear-cache",
    "notes", "note", "memo", "annotation",
];

// Commands that accept a domain parameter (for auto-filling)
const DOMAIN_COMMANDS = [
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
const RAW_SNIPPETS = [
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
const CONFIG_KEYS = ["timeout", "retry-timeout", "auto-triage", "tab-notify", "expert-mode", "reset", "list"];
const SUBCOMMAND_MAP = {
    config:   CONFIG_KEYS,
    settings: CONFIG_KEYS,
    set:      CONFIG_KEYS,
    prefs:    CONFIG_KEYS,
};

let tabCycleMatches = [];
let tabCycleIndex = -1;

export function initAutocompleteEngine() {
    InputEvents.on(InputEvents.EV_TAB_PRESSED, (currentLine) => {
        const input = currentLine.trimStart();
        if (!input) return;

        // If we are already cycling, continue cycling and ignore other logic
        if (tabCycleMatches.length > 0) {
            tabCycleIndex = (tabCycleIndex + 1) % tabCycleMatches.length;
            InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
            return;
        }

        const rawParts = input.split(/\s+/);
        const parts = input.trim().split(/\s+/);
        const hasTrailingSpace = input.endsWith(" ");

        const commandMatches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
        const isDomainCmd = DOMAIN_COMMANDS.includes(parts[0].toLowerCase());
        const canDomainFill = isDomainCmd && (hasTrailingSpace || commandMatches.length === 1);

        // Auto-fill context domain if command is fully typed
        // Prioritize command autocomplete if there are longer command matches, unless there's a trailing space
        if (parts.length === 1 && (rawParts.length === 1 || (rawParts.length === 2 && rawParts[1] === "")) && canDomainFill) {
            const domain = ContextManager.getDomain();
            if (domain) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, parts[0] + " " + domain + " ");
                return;
            }
        }

        // ── Subcommand completion: config <key> ─────────────────────
        const baseCmd = parts[0].toLowerCase();
        if (SUBCOMMAND_MAP[baseCmd] && parts.length <= 2) {
            const subKeys = SUBCOMMAND_MAP[baseCmd];
            const partial = parts.length === 2 ? parts[1].toLowerCase() : "";

            const matches = subKeys.filter(k => k.startsWith(partial));
            if (matches.length === 0) return;

            if (matches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${baseCmd} ${matches[0]} `);
            } else {
                const prefix = getLongestCommonPrefix(matches);
                if (prefix.length > partial.length) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${baseCmd} ${prefix}`);
                } else {
                    InputEvents.emit("EV_PRINT_OPTIONS", matches);
                    tabCycleMatches = matches.map(m => `${baseCmd} ${m} `);
                    tabCycleIndex = -1;
                }
            }
            return;
        }

        // ── Bash Snippet Completion (Matches Full String) ──
        if (input.includes(" ") || input.includes("-")) {
            const snippetMatches = RAW_SNIPPETS.filter(s => s.toLowerCase().startsWith(input.toLowerCase()));
            if (snippetMatches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, snippetMatches[0]);
                return;
            } else if (snippetMatches.length > 1) {
                const prefix = getLongestCommonPrefix(snippetMatches);
                if (prefix.length > input.length) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, prefix);
                } else {
                    InputEvents.emit("EV_PRINT_OPTIONS", snippetMatches);
                    tabCycleMatches = snippetMatches;
                    tabCycleIndex = -1;
                }
                return;
            }
        }

        // Standard command prefix completion
        if (parts.length === 1 && !hasTrailingSpace) {
            const matches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(input.toLowerCase()));

            if (matches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, matches[0] + " ");
            } else if (matches.length > 1) {
                const prefix = getLongestCommonPrefix(matches);

                if (prefix.length > input.length) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, prefix);
                } else {
                    InputEvents.emit("EV_PRINT_OPTIONS", matches);
                    tabCycleMatches = matches.map(m => m + " ");
                    tabCycleIndex = -1;
                }
            }
        }
    });

    // Reset cycle state on any other input event
    const resetCycle = () => {
        tabCycleMatches = [];
        tabCycleIndex = -1;
    };
    InputEvents.on(InputEvents.EV_KEY_TYPED, resetCycle);
    InputEvents.on(InputEvents.EV_PASTE_TEXT, resetCycle);
    InputEvents.on(InputEvents.EV_HISTORY_NAVIGATE, resetCycle);
}
