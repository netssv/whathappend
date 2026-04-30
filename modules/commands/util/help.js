/**
 * @module modules/commands/util/help.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, isIPAddress from '../../formatter.js'
 *     - ContextManager from '../../context.js'
 *     - getTermCols from '../../state.js'
 * - Exports: HELP_SECTIONS, cmdHelp
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI, isIPAddress } from "../../formatter.js";
import { ContextManager } from "../../context.js";
import { getTermCols } from "../../state.js";

// ===================================================================
//  help — Responsive layout (adapts to terminal width)
// ===================================================================

// Command definitions: [name, description, aliases]
export const HELP_SECTIONS = [
    { title: "AUDITS", cmds: [
        ["email", "MX+SPF+DMARC+DKIM", "mail"],
        ["web", "DNS+Headers+SSL", "audit"],
        ["sec", "Security scorecard", "scan security"],
        ["csp", "Content-Security-Policy", "xss"],
        ["waf", "WAF / CDN detection", "firewall"],
        ["hsts", "HSTS policy audit", "strict"],
        ["headers-check", "Security header checklist", "hcheck"],
    ]},
    { title: "DNS", cmds: [
        ["dig", "Full DNS [+short]", "dns record"],
        ["host", "A + AAAA + MX", ""],
        ["nslookup", "Name server lookup", "lookup"],
        ["ttl", "TTL all records", ""],
        ["dnssec", "DNSSEC zone auth", ""],
    ]},
    { title: "DNS SHORTCUTS", cmds: [
        ["a", "IPv4 address", ""],
        ["aaaa", "IPv6 address", ""],
        ["mx", "Mail servers", ""],
        ["txt", "Text records", ""],
        ["ns", "Nameservers", ""],
        ["cname", "Domain aliases", ""],
        ["soa", "Start of Authority", ""],
    ]},
    { title: "EMAIL", cmds: [
        ["spf", "SPF record", ""],
        ["dmarc", "DMARC policy", ""],
        ["dkim", "DKIM scan (dynamic)", ""],
    ]},
    { title: "WEB", cmds: [
        ["curl", "HTTP headers", "http headers"],
        ["openssl", "SSL/TLS cert", "ssl cert tls"],
        ["whois", "Domain WHOIS", "domain"],
        ["registrar", "Registrar lifecycle", "reg lifecycle"],
        ["hosting", "IP hosting provider", "provider webhost"],
        ["history", "Cert transparency logs", "crt"],
        ["rank", "Global traffic rank", "ranking traffic"],
        ["ping", "HTTP latency", "latency"],
        ["trace", "Redirect chain", "redirect follow"],
        ["robots", "robots.txt", "sitemap"],
        ["links", "Mixed content scan", "src"],
        ["wayback", "Archive.org timeline", "archive"],
        ["green", "Green energy host", ""],
        ["cookies", "Privacy cookies audit", ""],
        ["pixels", "Ad/tracking pixels", "tracking ads"],
        ["socials", "Social media presence", "social"],
        ["stack", "Technology stack", "tech cms"],
        ["seo", "Baseline SEO audit", "meta tags"],
        ["og", "Open Graph cards", "thaks opengraph"],
        ["alt", "Image accessibility", "a11y images"],
        ["schema", "Structured data scanner", "jsonld"],
        ["minify", "Asset minification check", "min"],
        ["load", "Performance timing", "perf timing"],
        ["vitals", "Core Web Vitals", "cwv web-vitals"],
        ["security-txt", "Security contact (RFC 9116)", "sec-txt"],
    ]},
    { title: "NETWORK", cmds: [
        ["isup", "Local vs global parity", "upcheck down"],
        ["speed", "Latency jitter test", "jitter"],
        ["speedtest", "Local bandwidth test", "bandwidth"],
        ["rev-dns", "Reverse DNS (PTR)", "rdns ptr"],
        ["port-scan", "Port scanner", "ports nmap"],
        ["ftp-check", "FTP banner grab", "ftp"],
        ["ip", "Public IP / domain IP", "myip public-ip"],
    ]},
    { title: "EXTERNAL", subtitle: "(opens link)", cmds: [
        ["blacklist", "Blacklist lookup", "bl rbl"],
        ["ssllabs", "SSL Labs deep scan", "ssltest"],
        ["securityheaders", "Header grade A+ to F", "sheaders"],
        ["whois-ext", "ICANN/DomainTools", "icann"],
    ]},
    { title: "UTIL", cmds: [
        ["start", "Analyze active tab", "run go begin"],
        ["switch", "Switch to active tab", "actual current here"],
        ["export", "Save report", "dump save"],
        ["target", "Set target domain", ""],
        ["tabs", "List / close / inspect tabs", "tab list close info"],
        ["reload", "Extension hard reboot", "restart reboot"],
        ["config", "User preferences", "settings set"],
        ["about", "Philosophy & identity", ""],
        ["info", "System diagnostics", "telemetry status"],
        ["errors", "Error & insight guide", "error"],
        ["clear", "Clear terminal", "cls reset"],
        ["flush", "Clear cookies+cache", "clearcache"],
        ["notes", "Session annotations", "note memo"],
        ["diff", "Compare two domains", ""],
        ["exit", "End session & clear", "quit"],
        ["help", "Show this menu", "? ls man"],
    ]},
];

export function cmdHelp(args = []) {
    const cols = getTermCols();

    // IP-aware dimming: domain-only commands are dimmed when target is an IP
    const currentTarget = ContextManager.getDomain();
    const targetIsIP = currentTarget ? isIPAddress(currentTarget) : false;
    const domainOnlyCmds = ["email", "spf", "dmarc", "dkim", "openssl", "whois", "registrar", "pixels", "socials", "stack", "robots", "web", "sec"];

    let o = "";

    if (targetIsIP) {
        o += `\n${ANSI.yellow}  ⚠ IP target detected (${currentTarget}) — domain-only commands dimmed${ANSI.reset}\n`;
    }

    if (args.length === 0) {
        // Exploratory Menu
        const sepLen = Math.min(cols - 4, 42);
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

        o += `\n${ANSI.white}${ANSI.bold}  EXPLORE COMMANDS${ANSI.reset}\n  ${sep}\n`;
        o += `  ${ANSI.dim}Type ${ANSI.white}help <category>${ANSI.dim} to view commands:${ANSI.reset}\n\n`;

        const categories = [
            ["audit", "High-level checks (email, web, sec)"],
            ["dns", "DNS resolution (dig, host, nslookup...)"],
            ["short", "DNS quick shortcuts (a, mx, txt...)"],
            ["email", "Email infrastructure (spf, dkim, dmarc)"],
            ["web", "Web auditing tools (whois, curl...)"],
            ["net", "Network & topology (ping, isup...)"],
            ["ext", "External third-party tools (opens link)"],
            ["util", "Terminal utilities (config, tabs...)"],
            ["all", "Show all commands"]
        ];

        for (const [cat, desc] of categories) {
            const label = `[${cat}]`;
            o += `  ${ANSI.cyan}${label.padEnd(9)}${ANSI.reset} ${ANSI.dim}${desc}${ANSI.reset}\n`;
        }

        o += `\n${ANSI.dim}  💡 Tip: Add ${ANSI.white}?${ANSI.dim} to any command for examples (e.g. ${ANSI.white}mx?${ANSI.dim})${ANSI.reset}\n`;
        o += `${ANSI.dim}  📚 Full Docs: ${ANSI.cyan}\x1b[4mhttps://github.com/netssv/whathappend/blob/main/COMMANDS.md\x1b[0m\n`;
        return o;
    }

    // Specific category requested
    const query = args[0].toLowerCase();
    
    // Mapping keywords to sections
    let targetSectionTitles = [];
    if (query === "audit" || query === "audits") targetSectionTitles = ["AUDITS"];
    else if (query === "dns") targetSectionTitles = ["DNS"];
    else if (query === "short" || query === "shortcuts") targetSectionTitles = ["DNS SHORTCUTS"];
    else if (query === "email" || query === "mail") targetSectionTitles = ["EMAIL"];
    else if (query === "web") targetSectionTitles = ["WEB"];
    else if (query === "net" || query === "network") targetSectionTitles = ["NETWORK"];
    else if (query === "ext" || query === "external") targetSectionTitles = ["EXTERNAL"];
    else if (query === "util" || query === "utils" || query === "utility") targetSectionTitles = ["UTIL"];
    else if (query === "all") targetSectionTitles = HELP_SECTIONS.map(s => s.title);
    else {
        return `\n  ${ANSI.red}Unknown category: ${query}${ANSI.reset}\n  ${ANSI.dim}Type 'help' to see available categories.${ANSI.reset}\n`;
    }

    const filteredSections = HELP_SECTIONS.filter(s => targetSectionTitles.includes(s.title));

    for (const section of filteredSections) {
        const sub = section.subtitle ? ` ${ANSI.dim}${section.subtitle}${ANSI.reset}` : "";
        const sepLen = Math.min(cols - 4, 42);
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

        o += `\n${ANSI.white}${ANSI.bold}  ${section.title}${ANSI.reset}${sub}\n  ${sep}\n`;

        for (const [name, desc, aliases] of section.cmds) {
            // Check if this command is domain-only and target is IP
            const cmdBase = name.split(" ")[0].toLowerCase();
            const isDimmed = targetIsIP && domainOnlyCmds.includes(cmdBase);
            const nameColor = isDimmed ? ANSI.dim : ANSI.cyan;
            const descColor = ANSI.dim;
            const dimTag = isDimmed ? ` ${ANSI.yellow}[domain]${ANSI.reset}` : "";

            if (cols < 50) {
                // Ultra narrow (mobile/squeezed side panel)
                o += `  ${nameColor}${name}${ANSI.reset}${dimTag}\n`;
                o += `    ${descColor}${desc}${ANSI.reset}\n`;
                if (aliases) {
                    o += `    ${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
                }
            } else {
                // Standard mode (clean 2-column layout with alias below)
                const pad = Math.max(1, 16 - name.length);
                o += `  ${nameColor}${name}${ANSI.reset}${" ".repeat(pad)}${descColor}${desc}${ANSI.reset}${dimTag}\n`;
                if (aliases) {
                    o += `  ${" ".repeat(16)}${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
                }
            }
        }
    }

    o += `\n${ANSI.dim}  Add ${ANSI.white}?${ANSI.dim} for details: ${ANSI.white}email?${ANSI.dim}  ${ANSI.white}mx?${ANSI.reset}\n`;
    o += `${ANSI.dim}  Omit domain = active tab | Ctrl+C cancel${ANSI.reset}\n`;
    return o;
}
