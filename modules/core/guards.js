import { ANSI } from "../formatter.js";
import { cmdDig } from "../commands/dns/index.js";

export async function checkTargetGuards(resolved, targetArg, targetIsIP) {
    // DNS-zone commands used with an IP → per-command contextual error
    const dnsCommands = ["spf", "dkim", "dmarc", "email", "mx", "ns", "soa", "txt", "cname", "a", "aaaa", "dig", "host", "nslookup"];
    if (targetIsIP && dnsCommands.includes(resolved)) {
        const cmdHelp = {
            dkim:  "DKIM is a DNS-level check (TXT records under selectors._domainkey).",
            spf:   "SPF records live in DNS TXT records for domain names.",
            dmarc: "DMARC policies are published as DNS TXT records under _dmarc.<domain>.",
            email: "Email audit requires MX/SPF/DMARC — all DNS-level domain checks.",
            mx:    "MX (Mail Exchange) records are only assigned to domain names.",
            ns:    "NS (Name Server) records are only assigned to domain names.",
            cname: "CNAME records map domain aliases, not IPs.",
        };
        const msg = cmdHelp[resolved] || `DNS record queries (${resolved.toUpperCase()}) require a domain name.`;
        return `${ANSI.red}[ERROR]${ANSI.reset} ${msg}\n` +
               `${ANSI.dim}IPs don't have these DNS records natively. Use ${ANSI.white}rev-dns${ANSI.dim} to find the domain first.${ANSI.reset}\n` +
               `${ANSI.yellow}Suggested commands for IP ${targetArg}:${ANSI.reset}\n` +
               `  ${ANSI.cyan}rev-dns ${targetArg}${ANSI.reset}  ${ANSI.dim}— find the domain behind this IP${ANSI.reset}\n` +
               `  ${ANSI.cyan}whois ${targetArg}${ANSI.reset}    ${ANSI.dim}— check IP registry owner (ARIN/RIPE/APNIC)${ANSI.reset}\n` +
               `  ${ANSI.cyan}blacklist ${targetArg}${ANSI.reset}  ${ANSI.dim}— check IP reputation${ANSI.reset}\n` +
               `  ${ANSI.cyan}port-scan ${targetArg}${ANSI.reset}  ${ANSI.dim}— scan open ports${ANSI.reset}`;
    }

    // SSL/openssl used with an IP → SNI contextual error
    if (targetIsIP && resolved === "openssl") {
        return `${ANSI.red}[ERROR]${ANSI.reset} SSL certificates are tied to SNI (Server Name Indication) — they use domain names.\n` +
               `${ANSI.dim}An IP address alone cannot identify which certificate to present.${ANSI.reset}\n` +
               `${ANSI.yellow}To find the domain for this IP:${ANSI.reset}\n` +
               `  ${ANSI.cyan}rev-dns ${targetArg}${ANSI.reset}  ${ANSI.dim}— reverse DNS lookup${ANSI.reset}\n` +
               `${ANSI.yellow}Or use an external scanner:${ANSI.reset}\n` +
               `  ${ANSI.cyan}ssllabs${ANSI.reset}  ${ANSI.dim}— Qualys SSL Labs deep scan (works with IPs for some configs)${ANSI.reset}`;
    }

    // rev-dns used with a domain → contextual error + auto-dig
    if (!targetIsIP && resolved === "rev-dns" && targetArg && /^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i.test(targetArg)) {
        let errOutput = `${ANSI.red}[ERROR]${ANSI.reset} rev-dns requires a numeric IP address.\n`;
        errOutput += `${ANSI.dim}'${targetArg}' looks like a domain name.${ANSI.reset}\n`;
        errOutput += `${ANSI.yellow}Running 'dig A ${targetArg}' first...${ANSI.reset}\n\n`;
        // Auto-run dig A to show the IP
        try {
            const digResult = await cmdDig([targetArg], "A", [], true);
            errOutput += digResult;
            errOutput += `\n\n${ANSI.dim}Copy the IP above and run: ${ANSI.white}rev-dns <IP>${ANSI.reset}`;
        } catch (_) {
            errOutput += `${ANSI.dim}Could not resolve A record. Check the domain.${ANSI.reset}`;
        }
        return errOutput;
    }

    return null; // No guard violation
}
