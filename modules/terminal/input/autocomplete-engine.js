import { InputEvents } from "./events.js";
import { ContextManager } from "../../context.js";

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
    "load", "perf", "performance", "speed", "pagespeed", "timing",
    "reg", "lifecycle",
    "hoster", "provider", "webhost",
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
    "load", "perf", "performance", "speed", "pagespeed", "timing",
    "reg", "lifecycle",
    "hoster", "provider", "webhost",
];

let tabCycleMatches = [];
let tabCycleIndex = -1;

export function initAutocompleteEngine() {
    InputEvents.on(InputEvents.EV_TAB_PRESSED, (currentLine) => {
        const input = currentLine.trimStart();
        if (!input) return;

        const rawParts = input.split(/\s+/);
        const parts = input.trim().split(/\s+/);
        const hasTrailingSpace = input.endsWith(" ");

        // Auto-fill context domain if command is fully typed with no arguments
        if (parts.length === 1 && (rawParts.length === 1 || (rawParts.length === 2 && rawParts[1] === "")) && DOMAIN_COMMANDS.includes(parts[0].toLowerCase())) {
            const domain = ContextManager.getDomain();
            if (domain) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, parts[0] + " " + domain + " ");
                return;
            }
        }

        // Standard command prefix completion
        if (parts.length === 1 && !hasTrailingSpace) {
            // Cycle through existing matches if we're already cycling
            if (tabCycleMatches.length > 0) {
                tabCycleIndex = (tabCycleIndex + 1) % tabCycleMatches.length;
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex] + " ");
                return;
            }

            // Find new matches
            const matches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(input.toLowerCase()));

            if (matches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, matches[0] + " ");
            } else if (matches.length > 1) {
                // Request UI to print options
                InputEvents.emit("EV_PRINT_OPTIONS", matches);

                // Start cycling state and auto-fill the first match
                tabCycleMatches = matches;
                tabCycleIndex = 0;
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, matches[0] + " ");
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
