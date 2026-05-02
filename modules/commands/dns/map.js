/**
 * @module modules/commands/dns/map.js
 * @description ASCII visual map of the DNS resolution journey.
 */

import { ANSI, resolveTargetDomain, toRegisteredDomain } from "../../formatter.js";

async function doLookup(domain, type) {
    const resp = await chrome.runtime.sendMessage({ command: "dns", payload: { domain, type } });
    if (!resp || !resp.data || !resp.data.Answer) return [];
    return resp.data.Answer.map(r => r.data).filter(Boolean);
}

export async function cmdMap(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return `${ANSI.red}[ERROR] No domain specified.${ANSI.reset}`;

    try {
        // Find registered domain to query NS (e.g. sv.siman.com -> siman.com)
        const rootDomain = toRegisteredDomain(domain);
        
        // 1. Fetch Name Servers
        let nsRecords = await doLookup(rootDomain, "NS");
        if (nsRecords.length === 0) {
            // fallback to SOA
            const soa = await doLookup(rootDomain, "SOA");
            if (soa.length > 0) nsRecords = [soa[0].split(" ")[0]];
        }
        const nsStr = nsRecords.length > 0 ? nsRecords[0] + (nsRecords.length > 1 ? " (+" + (nsRecords.length-1) + ")" : "") : "Unknown NS";

        // 2. Fetch IP Address (follow CNAME chain if needed)
        let aRecords = await doLookup(domain, "A");
        const cnameRecords = await doLookup(domain, "CNAME");
        
        let cnameStr = "";
        if (cnameRecords.length > 0) {
            cnameStr = `\n       ${ANSI.dim}│${ANSI.reset}  ${ANSI.yellow}Alias Detected:${ANSI.reset} CNAME ➔ ${cnameRecords[0]}`;
            // If no direct A record, resolve the CNAME target
            if (aRecords.length === 0) {
                const cnameTarget = cnameRecords[0].replace(/\.$/, "");
                aRecords = await doLookup(cnameTarget, "A");
            }
        }

        const ipStr = aRecords.length > 0 ? aRecords[0] : "Unknown IP";

        // Extract TLD
        const parts = rootDomain.split(".");
        const tld = parts.length > 1 ? "." + parts.pop() : ".com";

        let out = `\n${ANSI.cyan}${ANSI.bold}  DNS Resolution Journey for ${domain}${ANSI.reset}\n`;
        out += `  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}\n\n`;

        out += `  ${ANSI.bold}1. ${ANSI.blue}💻 You (Browser)${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  Queries OS / Router DNS cache\n`;
        out += `       ${ANSI.dim}▼${ANSI.reset}\n`;

        out += `  ${ANSI.bold}2. ${ANSI.yellow}🌐 DNS Resolver${ANSI.reset} ${ANSI.dim}(e.g. 8.8.8.8)${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  Cache Miss! Starts recursive lookup...\n`;
        out += `       ${ANSI.dim}▼${ANSI.reset}\n`;

        out += `  ${ANSI.bold}3. ${ANSI.magenta}🌲 Root Servers (.)${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  "I don't know the IP, but I know who handles ${tld}"\n`;
        out += `       ${ANSI.dim}▼${ANSI.reset}\n`;

        out += `  ${ANSI.bold}4. ${ANSI.cyan}🏷️ TLD Servers (${tld})${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  "Go ask the authoritative nameservers for ${rootDomain}"\n`;
        out += `       ${ANSI.dim}▼${ANSI.reset}\n`;

        out += `  ${ANSI.bold}5. ${ANSI.green}📚 Authoritative NS${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  Target NS: ${ANSI.white}${nsStr}${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  "The IP address for ${domain} is ${ANSI.white}${ipStr}${ANSI.reset}"${cnameStr}\n`;
        out += `       ${ANSI.dim}▼${ANSI.reset}\n`;

        out += `  ${ANSI.bold}6. ${ANSI.red}🎯 Target Server${ANSI.reset}\n`;
        out += `       ${ANSI.dim}│${ANSI.reset}  Connection established to ${ANSI.white}${ipStr}${ANSI.reset} over TCP/TLS\n`;
        out += `       ${ANSI.green}✔  Page Loads!${ANSI.reset}\n\n`;

        return out;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
