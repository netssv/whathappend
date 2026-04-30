/**
 * @module modules/commands/web/flush.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, cmdError from '../../formatter.js'
 * - Exports: cmdFlush
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError } from "../../formatter.js";

// ===================================================================
//  flush — Clear cookies and cache for the target domain
//
//  Uses chrome.browsingData scoped to the target domain's origin.
//  Requires explicit domain argument (no auto-target) as a safety
//  mechanism to prevent accidental cache clears.
// ===================================================================

export async function cmdFlush(args) {
    if (args.length === 0) {
        return cmdUsage("flush", "<domain>") + `\n${ANSI.dim}Explicit domain required for safety.${ANSI.reset}`;
    }

    const domain = resolveTargetDomain(args[0]);
    if (!domain) return cmdUsage("flush", "<domain>");

    const origin = `https://${domain}`;
    let o = `> chrome.browsingData.remove({origins: ["${origin}"]})\n`;
    o += `${ANSI.dim}Clearing cookies and cache for ${domain}...${ANSI.reset}\n\n`;

    try {
        await chrome.browsingData.remove(
            { origins: [origin] },
            { cookies: true, cache: true }
        );

        o += `  ${ANSI.green}✓${ANSI.reset} Cookies and cache cleared for ${ANSI.cyan}${domain}${ANSI.reset}\n`;

        o += insights([
            { level: "PASS", text: `Cleared browsing data for ${domain}.` },
            { level: "INFO", text: "Session cookies and cached resources have been removed." },
            { level: "INFO", text: "Reload the page to see fresh content." },
        ]);
        return o;

    } catch (err) {
        return o + cmdError(`Failed to clear data: ${err.message}`);
    }
}
