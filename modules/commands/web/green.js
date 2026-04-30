/**
 * @module modules/commands/web/green.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, formatError from '../../formatter.js'
 * - Exports: cmdGreen
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError } from "../../formatter.js";

// ===================================================================
//  green — Environmental Check
// ===================================================================

export async function cmdGreen(args) {
    const info = {};
    const t = resolveTargetDomain(args[0], info);
    if (!t) return cmdUsage("green", "<domain>");
    
    let o = `> curl -s https://api.thegreenwebfoundation.org/greencheck/${t}\n`;
    
    try {
        const res = await fetch(`https://api.thegreenwebfoundation.org/greencheck/${t}`, {
            signal: AbortSignal.timeout(4000)
        });
        
        if (!res.ok) throw new Error("API HTTP " + res.status);
        const data = await res.json();
        
        const isGreen = data.green;
        const provider = data.hosted_by || "an unknown provider";
        
        o += `  ${ANSI.dim}Checking The Green Web Foundation database...${ANSI.reset}\n`;
        o += `  ${ANSI.dim}Provider:${ANSI.reset} ${ANSI.cyan}${provider}${ANSI.reset}\n`;
        
        const ins = [];
        if (isGreen) {
            ins.push({ level: "PASS", text: `Hosted on Green Energy (${provider})` });
        } else {
            ins.push({ level: "INFO", text: "Standard hosting detected (Not confirmed as green energy)" });
        }
        ins.push({ level: "INFO", text: `External Check: https://www.thegreenwebfoundation.org/green-web-check/?url=${domain}` });
        return o + insights(ins);
        
    } catch (e) {
        if (e.name === "TimeoutError") {
            return o + formatError("TIMEOUT", "Green Web Foundation API did not respond.", "The service might be experiencing high load.");
        }
        return o + formatError("FETCH_FAILED", e.message, "Green Web Foundation API is unreachable.");
    }
}
