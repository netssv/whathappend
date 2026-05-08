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

// ── Show both local IP + active page IP ──────────────────────────────

async function showPublicIP() {
    let o = `> curl -s https://api.ipify.org\n`;
    o += `${ANSI.dim}Fetching public IP...${ANSI.reset}\n\n`;

    // Resolve both in parallel
    const [pubResp, pageIP] = await Promise.allSettled([
        chrome.runtime.sendMessage({ command: "get-public-ip" }),
        resolveActivePageIP(),
    ]);

    // Local IP
    const pub = pubResp.status === "fulfilled" ? pubResp.value : null;
    if (!pub || pub.error) {
        o += `  ${ANSI.white}Your IP:${ANSI.reset}      ${ANSI.dim}Unavailable${ANSI.reset}\n`;
    } else {
        const ip = pub.data?.ip || pub.ip;
        o += `  ${ANSI.white}Your IP:${ANSI.reset}      ${ANSI.green}${ip}${ANSI.reset}\n`;
        const isp = await resolveProvider(ip);
        if (isp) o += `  ${ANSI.white}ISP:${ANSI.reset}          ${ANSI.cyan}${isp}${ANSI.reset}\n`;
    }

    // Active page IP
    const siteIP = pageIP.status === "fulfilled" ? pageIP.value : null;
    if (siteIP) {
        o += `  ${ANSI.white}Active Web IP:${ANSI.reset}  ${ANSI.green}${siteIP.ip}${ANSI.reset}`;
        if (siteIP.domain) o += ` ${ANSI.dim}(${siteIP.domain})${ANSI.reset}`;
        o += `\n`;
        if (siteIP.provider) o += `  ${ANSI.white}Host:${ANSI.reset}         ${ANSI.cyan}${siteIP.provider}${ANSI.reset}\n`;
    }

    const userIP = pub?.data?.ip || pub?.ip || "";
    const ins = [];
    if (userIP) ins.push({ level: "INFO", text: `IP WHOIS: https://rdap.org/ip/${userIP}` });
    if (siteIP?.ip) ins.push({ level: "INFO", text: `Site WHOIS: https://rdap.org/ip/${siteIP.ip}` });
    ins.push({ level: "INFO", text: `External Check: https://whatismyipaddress.com/` });
    o += insights(ins);
    return o;
}

async function resolveActivePageIP() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return null;
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!domain || isIPAddress(domain) || domain === "localhost") return null;

        const aResp = await chrome.runtime.sendMessage({
            command: "dns", payload: { domain, type: "A" },
        });
        const aRecord = aResp?.data?.Answer?.find(r => r.type === 1);
        if (!aRecord?.data) return null;

        const ip = aRecord.data.trim();
        const provider = await resolveProvider(ip);
        return { ip, domain, provider };
    } catch (_) {
        return null;
    }
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
    o += `  ${ANSI.white}Remote Hosting IP:${ANSI.reset}  ${ANSI.green}${ip}${ANSI.reset}\n`;

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
