/**
 * @module modules/commands/web/rank.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage from '../../formatter.js'
 * - Exports: cmdRank
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

// ===================================================================
//  rank — Global Traffic Rank (Tranco)
// ===================================================================

export async function cmdRank(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("rank", "<domain>");

    let o = `> curl -s https://tranco-list.eu/api/ranks/domain/${domain}\n`;
    o += `${ANSI.dim}Fetching global traffic ranking...${ANSI.reset}\n\n`;

    try {
        const resp = await chrome.runtime.sendMessage({
            command: "fetch-text",
            payload: { url: `https://tranco-list.eu/api/ranks/domain/${domain}` }
        });

        if (!resp || resp.error) {
            return o + formatError("FETCH_FAILURE", resp?.error || "Could not fetch rank data.", "Tranco API might be unreachable.");
        }

        let data;
        try {
            data = JSON.parse(resp.data?.text || "{}");
        } catch (e) {
            return o + formatError("FETCH_FAILURE", "Invalid JSON response from Tranco.", "The API might be down.");
        }

        const ranks = data.ranks || [];
        
        if (ranks.length === 0) {
            o += `  ${ANSI.yellow}No rank data found for ${domain}${ANSI.reset}\n`;
            o += `  ${ANSI.dim}This domain is not in the top 1 million websites.${ANSI.reset}\n`;
            
            const ins = [];
            ins.push({level:"INFO", text:"Domain receives low traffic or is very new."});
            ins.push({level:"INFO", text:"Note: Google PageRank is obsolete. Tranco is the modern standard for global web ranking."});
            o += insights(ins);
            return o;
        }

        const currentRank = ranks[ranks.length - 1].rank;
        const previousRank = ranks.length > 30 ? ranks[ranks.length - 30].rank : ranks[0].rank; // Approx 1 month ago
        
        const rankFormatted = new Intl.NumberFormat().format(currentRank);
        
        o += `  ${ANSI.white}${ANSI.bold}Global Rank:${ANSI.reset} ${ANSI.cyan}#${rankFormatted}${ANSI.reset}\n`;
        
        if (previousRank && previousRank !== currentRank) {
            const diff = previousRank - currentRank;
            const diffFormatted = new Intl.NumberFormat().format(Math.abs(diff));
            if (diff > 0) {
                o += `  ${ANSI.dim}30-Day Trend:${ANSI.reset} ${ANSI.green}▲ Up ${diffFormatted} places${ANSI.reset}\n`;
            } else {
                o += `  ${ANSI.dim}30-Day Trend:${ANSI.reset} ${ANSI.red}▼ Down ${diffFormatted} places${ANSI.reset}\n`;
            }
        }

        o += `\n${ANSI.dim}Executed: Tranco Open Rank fetch${ANSI.reset}`;

        const ins = [];
        if (currentRank < 100000) {
            ins.push({level:"PASS", text:"High traffic site (Top 100k globally)."});
        } else if (currentRank < 1000000) {
            ins.push({level:"INFO", text:"Moderate traffic site (Top 1M globally)."});
        } else {
            ins.push({level:"INFO", text:"Low traffic site (Outside Top 1M)."});
        }

        ins.push({level:"INFO", text:"Note: Google PageRank is obsolete. Tranco is the modern standard for global web ranking."});
        ins.push({level:"INFO", text:`External Check: https://www.similarweb.com/website/${domain}/`});

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("FETCH_FAILURE", err.message, "The API request failed.");
    }
}
