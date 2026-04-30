/**
 * @module modules/commands/web/schema.js
 * @description Structured Data (Schema.org) Scanner.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

export async function cmdSchema(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("schema", "[domain]");

    let o = `> scanning DOM for application/ld+json and microdata...\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ 
            command: "dom-query", 
            payload: { 
                url, 
                selector: "script[type='application/ld+json']" 
            } 
        });

        if (!resp || resp.error) {
            return o + formatError("DOM_FAILURE", resp?.error || "Could not access page DOM.", "Make sure the tab is active.");
        }

        const schemas = resp.data || [];
        const ins = [];

        if (schemas.length === 0) {
            o += `${ANSI.yellow}No JSON-LD structured data found.${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "No JSON-LD detected. Structured data is vital for rich search results (Rich Snippets)." });
        } else {
            o += `${ANSI.green}Found ${schemas.length} JSON-LD block(s):${ANSI.reset}\n`;
            
            schemas.forEach((s, i) => {
                try {
                    const json = JSON.parse(s.textContent);
                    const type = json["@type"] || json["@context"];
                    o += `  ${ANSI.dim}${i+1}.${ANSI.reset} ${ANSI.cyan}${type}${ANSI.reset}\n`;
                } catch (e) {
                    o += `  ${ANSI.dim}${i+1}.${ANSI.reset} ${ANSI.red}Invalid JSON content${ANSI.reset}\n`;
                }
            });
            
            ins.push({ level: "PASS", text: "JSON-LD structured data is present." });
        }

        ins.push({ level: "INFO", text: "Use Google's Rich Results Test for deep validation: https://search.google.com/test/rich-results" });

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to run schema audit.");
    }
}
