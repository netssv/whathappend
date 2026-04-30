/**
 * @module modules/commands/web/wayback.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, formatError from '../../formatter.js'
 * - Exports: cmdWayback
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError } from "../../formatter.js";

// ===================================================================
//  wayback — Temporal Persistence
// ===================================================================

export async function cmdWayback(args) {
    const info = {};
    const t = resolveTargetDomain(args[0], info);
    if (!t) return cmdUsage("wayback", "<domain>");
    
    let o = `> wayback ${t}\n`;
    
    try {
        let res = await fetch(`https://archive.org/wayback/available?url=${t}`, {
            signal: AbortSignal.timeout(8000)
        });
        
        if (!res.ok) throw new Error("API HTTP " + res.status);
        let data = await res.json();
        let closest = data?.archived_snapshots?.closest;
        
        // Retry with www. if bare domain fails
        if ((!closest || !closest.available) && !t.startsWith("www.")) {
            res = await fetch(`https://archive.org/wayback/available?url=www.${t}`, {
                signal: AbortSignal.timeout(8000)
            });
            if (res.ok) {
                data = await res.json();
                closest = data?.archived_snapshots?.closest;
            }
        }
        
        if (!closest || !closest.available) {
            return o + `  ${ANSI.magenta}🕒${ANSI.reset} ${ANSI.dim}No historical snapshots found in the Wayback Machine.${ANSI.reset}\n`;
        }
        
        const ts = closest.timestamp; // Format: 20260425000023
        const year = ts.substring(0, 4);
        const month = ts.substring(4, 6);
        const day = ts.substring(6, 8);
        
        const dateStr = `${year}-${month}-${day}`;
        const archiveDate = new Date(dateStr);
        const daysAgo = Math.floor((Date.now() - archiveDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysText = daysAgo === 0 ? "today" : `${daysAgo} day(s) ago`;
        
        o += `  ${ANSI.magenta}🕒${ANSI.reset} ${ANSI.dim}Last seen online:${ANSI.reset} ${ANSI.cyan}${dateStr}${ANSI.reset} ${ANSI.dim}(${daysText})${ANSI.reset}\n`;
        
        const secureUrl = closest.url.replace(/^http:\/\//i, "https://");
        
        const ins = [];
        ins.push({ level: "INFO", text: `If the site is down now but was seen ${daysAgo} days ago, check recent server migrations or DNS propagation.` });
        ins.push({ level: "INFO", text: `View snapshot: ${secureUrl}` });
        
        return o + insights(ins);
        
    } catch (e) {
        if (e.name === "TimeoutError") {
            return o + formatError("TIMEOUT", "Archive.org did not respond in time.", "The Wayback Machine API may be experiencing high load.");
        }
        return o + formatError("FETCH_FAILED", e.message, "Wayback Machine API is unreachable.");
    }
}
