/**
 * @module modules/commands/web/ip.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - resolveProvider from '../../utils.js'
 * - Exports: cmdIP
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  ip — Dual-mode IP command
//
//  ip           → Show user's public IP + ISP
//  ip <domain>  → Resolve A record → IP → hosting provider
// ===================================================================

export async function cmdIP(args) {
    if (args.length === 0) return showPublicIP();

    const domain = resolveTargetDomain(args[0]);
    if (!domain) return cmdUsage("ip", "[domain]");

    if (isIPAddress(domain)) return resolveIPProvider(domain);

    return resolveDomainIP(domain);
}

// ── Show local user's public IP ─────────────────────────────────────

async function showPublicIP() {
    let o = `> curl -s https://api.ipify.org\n`;
    o += `${ANSI.dim}Fetching public IP...${ANSI.reset}\n\n`;

    const resp = await chrome.runtime.sendMessage({ command: "get-public-ip" });
    if (!resp) return o + workerError();
    if (resp.error) return o + cmdError(resp.error);

    const ip = resp.data.ip;
    o += `  ${ANSI.white}Public IP:${ANSI.reset}  ${ANSI.green}${ip}${ANSI.reset}\n`;

    // Resolve ISP via RDAP
    const isp = await resolveProvider(ip);
    if (isp) {
        o += `  ${ANSI.white}ISP:${ANSI.reset}        ${ANSI.cyan}${isp}${ANSI.reset}\n`;
    }

    const ins = [
        { level: "INFO", text: `IP WHOIS: https://rdap.org/ip/${ip}` },
        { level: "INFO", text: `External Check: https://whatismyipaddress.com/` },
    ];
    o += insights(ins);
    return o;
}

// ── Resolve domain → A record → provider ────────────────────────────

async function resolveDomainIP(domain) {
    let o = `> dig ${domain} A +short\n`;

    const aResp = await chrome.runtime.sendMessage({
        command: "dns",
        payload: { domain, type: "A" },
    });

    const aRecord = aResp?.data?.Answer?.find(r => r.type === 1);
    if (!aRecord?.data) {
        return o + cmdError(`No A record found for ${domain}.`);
    }

    const ip = aRecord.data.trim();
    return resolveIPProvider(ip, o, domain);
}

// ── Resolve IP → provider via RDAP ──────────────────────────────────

async function resolveIPProvider(ip, prefix = "", domain = null) {
    let o = prefix || `> whois ${ip} | grep -i orgname\n`;
    o += `  ${ANSI.white}IP:${ANSI.reset}         ${ANSI.green}${ip}${ANSI.reset}\n`;

    const provider = await resolveProvider(ip);
    if (provider) {
        o += `  ${ANSI.white}Provider:${ANSI.reset}   ${ANSI.cyan}${provider}${ANSI.reset}\n`;
    } else {
        o += `  ${ANSI.white}Provider:${ANSI.reset}   ${ANSI.dim}Unknown${ANSI.reset}\n`;
    }

    const ins = [];
    if (provider) ins.push({ level: "INFO", text: `Hosted by ${provider}.` });
    else ins.push({ level: "WARN", text: "Could not determine provider via RDAP." });
    ins.push({ level: "INFO", text: `IP WHOIS: https://rdap.org/ip/${ip}` });
    if (domain) ins.push({ level: "INFO", text: `External Check: https://who.is/whois/${domain}` });

    o += insights(ins);
    return o;
}
