/**
 * @module modules/commands/dns/nslookup.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, resolveTargetDomain, cmdUsage, cmdError, workerError from '../../formatter.js'
 * - Exports: cmdNslookup
 * - Layer: Command Layer (DNS) - Executes DNS resolution and formatting.
 */

import {ANSI, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  nslookup
// ===================================================================

export async function cmdNslookup(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("nslookup", "<domain>");

    let aR, aaaaR;
    try {
        [aR, aaaaR] = await Promise.all([
            chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"A"}}),
            chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"AAAA"}}),
        ]);
    } catch (err) {
        return cmdError(` DNS queries failed: ${err.message}`);
    }

    let o = "";
    o += `> nslookup ${domain}\n`;

    o += `Server:         dns.google\n`;
    o += `Address:        8.8.8.8#443\n\n`;
    o += `${ANSI.dim}Non-authoritative answer:${ANSI.reset}\n`;

    let found = false;
    if (aR.data?.Answer) {
        for (const r of aR.data.Answer) {
            if (r.type === 5) { o += `${domain}\tcanonical name = ${ANSI.cyan}${r.data}${ANSI.reset}\n`; found = true; }
        }
    }
    if (aR.data?.Answer) {
        for (const r of aR.data.Answer) {
            if (r.type === 1) { o += `Name:\t${domain}\nAddress: ${ANSI.yellow}${r.data}${ANSI.reset}\n`; found = true; }
        }
    }
    if (aaaaR.data?.Answer) {
        for (const r of aaaaR.data.Answer) {
            if (r.type === 28) { o += `Name:\t${domain}\nAddress: ${ANSI.yellow}${r.data}${ANSI.reset}\n`; found = true; }
        }
    }

    if (!found) {
        if (aR.data?.Status === 3) {
            o += `${ANSI.red}** server can't find ${domain}: NXDOMAIN${ANSI.reset}\n`;
            o += `${ANSI.dim}Check status: https://www.isitdownrightnow.com/?url=${encodeURIComponent(domain)}${ANSI.reset}\n`;
        } else o += `${ANSI.yellow}** No answer for ${domain}${ANSI.reset}\n`;
    }

    o += insights([{level: "INFO", text: `External Check: https://mxtoolbox.com/SuperTool.aspx?action=a%3A${encodeURIComponent(domain)}`}]);
    return o;
}
