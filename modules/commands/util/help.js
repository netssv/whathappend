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
    ]},
    { title: "DNS", cmds: [
        ["dig", "Full DNS [+short]", "dns record"],
        ["host", "A + AAAA + MX", ""],
        ["nslookup", "Name server lookup", "lookup"],
        ["ttl", "TTL all records", ""],
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
        ["ping", "HTTP latency", "latency"],
        ["trace", "Redirect chain", "redirect follow"],
        ["robots", "robots.txt", "sitemap"],
        ["pixels", "Ad/tracking pixels", "tracking ads"],
        ["stack", "Tech stack detect", "tech cms"],
    ]},
    { title: "NETWORK", cmds: [
        ["rev-dns", "Reverse DNS (PTR)", "rdns ptr"],
        ["port-scan", "Port scanner", "ports nmap"],
        ["ftp-check", "FTP banner grab", "ftp"],
    ]},
    { title: "EXTERNAL", subtitle: "(opens link)", cmds: [
        ["blacklist", "Blacklist lookup", "bl rbl"],
        ["ssllabs", "SSL Labs deep scan", "ssltest"],
        ["securityheaders", "Header grade A+ to F", "sheaders"],
        ["whois-ext", "ICANN/DomainTools", "icann"],
    ]},
    { title: "UTIL", cmds: [
        ["export", "Save report", "dump save"],
        ["target", "Set target domain", ""],
        ["errors", "Error & insight guide", "error"],
        ["clear", "Clear terminal", "cls reset"],
        ["help", "Show this menu", "? ls man"],
    ]},
];

export function cmdHelp() {
    const cols = getTermCols();
    // Narrow mode: < 60 cols → stack command + description vertically
    const narrow = cols < 60;
    // Medium: 60-75 → show cmd + desc only
    const medium = cols >= 60 && cols < 75;

    // IP-aware dimming: domain-only commands are dimmed when target is an IP
    const currentTarget = ContextManager.getDomain();
    const targetIsIP = currentTarget ? isIPAddress(currentTarget) : false;
    const domainOnlyCmds = ["email", "spf", "dmarc", "dkim", "openssl", "whois", "registrar", "pixels", "stack", "robots", "web", "sec"];

    let o = "";

    if (targetIsIP) {
        o += `\n${ANSI.yellow}  ⚠ IP target detected (${currentTarget}) — domain-only commands dimmed${ANSI.reset}\n`;
    }

    for (const section of HELP_SECTIONS) {
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

            if (narrow) {
                // Narrow: command on first line, description indented below
                o += `  ${nameColor}${name}${ANSI.reset}${dimTag}\n`;
                o += `    ${descColor}${desc}${ANSI.reset}\n`;
            } else if (medium) {
                // Medium: padded command + desc
                const pad = Math.max(1, 16 - name.length);
                o += `  ${nameColor}${name}${ANSI.reset}${" ".repeat(pad)}${descColor}${desc}${ANSI.reset}${dimTag}\n`;
            } else {
                // Wide: command + desc + aliases
                const pad1 = Math.max(1, 17 - name.length);
                const descPad = Math.max(1, 25 - desc.length);
                if (aliases) {
                    o += `  ${nameColor}${name}${ANSI.reset}${" ".repeat(pad1)}${descColor}${desc}${" ".repeat(descPad)}${ANSI.gray}${aliases}${ANSI.reset}${dimTag}\n`;
                } else {
                    o += `  ${nameColor}${name}${ANSI.reset}${" ".repeat(pad1)}${descColor}${desc}${ANSI.reset}${dimTag}\n`;
                }
            }
        }
    }

    o += `\n${ANSI.dim}  Add ${ANSI.white}?${ANSI.dim} for details: ${ANSI.white}email?${ANSI.dim}  ${ANSI.white}mx?${ANSI.reset}\n`;
    o += `${ANSI.dim}  Omit domain = active tab | Ctrl+C cancel${ANSI.reset}\n`;
    return o;
}
