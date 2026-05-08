/**
 * @module modules/commands/web/whois.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, toRegisteredDomain, isIPAddress, cmdUsage, workerError, cmdError from '../../formatter.js'
 *     - extractRegistrar, extractExpiry from './whois-parser.js'
 *     - getConfig from '../util/config.js'
 * - Exports: cmdWhois
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, toRegisteredDomain, isIPAddress, cmdUsage, workerError, cmdError } from "../../formatter.js";
import { getConfig } from "../util/config.js";
import { formatShort, formatFull } from "./whois-formatter.js";

// ===================================================================
// whois — Terminal command (client layer)
//
// Pure command logic: input validation, message passing, output formatting.
// All heuristic extraction is delegated to whois-parser.js.
// ===================================================================

// ---------------------------------------------------------------------------
// Domain WHOIS — RDAP
// ---------------------------------------------------------------------------

export async function cmdWhois(args, flags = []) {
    const info = {};
    const raw = resolveTargetDomain(args[0], info);
    if (!raw) return cmdUsage("whois", "<domain|ip>");
    if (isIPAddress(raw)) return ipWhois(raw, flags);

    const domain = toRegisteredDomain(raw);
    const isShort = flags.includes("--short");

    const resp = await chrome.runtime.sendMessage({ command: "whois", payload: { domain } });
    if (!resp) return workerError();
    if (resp.error) return handleWhoisError(resp.error, domain, isShort);

    const isExpert = await getConfig("expert-mode");
    if (isExpert && !isShort) {
        return `> whois ${domain}\n${ANSI.dim}${JSON.stringify(resp.data, null, 2)}${ANSI.reset}\n`;
    }

    return isShort
        ? formatShort(resp.data, domain)
        : formatFull(resp.data, domain);
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

function handleWhoisError(error, domain, isShort) {
    if (!error.includes("404") && !error.includes("failed with HTTP")) return cmdError(error);
    if (isShort) return ""; // silent fail for auto-target flow

    const tld = domain.split(".").slice(1).join(".");
    let o = `> whois ${domain}\n`;
    o += `${ANSI.yellow}[WARN] .${tld} registry does not support RDAP.${ANSI.reset}\n`;
    o += `${ANSI.dim}Many country-code TLDs (ccTLDs) don't have RDAP endpoints.${ANSI.reset}\n`;
    o += insights([
        { level: "INFO", text: `Lookup WHOIS: https://www.whois.com/whois/${domain}` },
        { level: "INFO", text: `Alternative: https://who.is/whois/${domain}` },
    ]);
    return o;
}

// ---------------------------------------------------------------------------
// IP WHOIS — RDAP /ip/ endpoint
// ---------------------------------------------------------------------------

async function ipWhois(ip, flags) {
    const isShort = flags.includes("--short");
    const resp = await chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip } });
    if (!resp) return workerError();
    if (resp.error) return cmdError(`IP WHOIS failed for ${ip}\n${ANSI.dim}${resp.error}`);

    const org = resp.org || "Unknown";
    if (isShort) return `  ${ANSI.white}Owner:${ANSI.reset} ${org}`;

    let o = `> whois ${ip}\n`;
    o += `${ANSI.white}IP Address:${ANSI.reset} ${ip}\n`;
    o += `${ANSI.white}Organization:${ANSI.reset} ${org}\n`;
    o += insights([
        { level: "INFO", text: `Owner: ${org}` },
        { level: "INFO", text: `External Check: https://www.whois.com/whois/${ip}` },
    ]);
    return o;
}
