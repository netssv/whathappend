/**
 * @module modules/commands/web/minify.js
 * @description Asset minification audit.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

export async function cmdMinify(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("minify", "[domain]");

    let o = `> scanning DOM for unminified .js/.css assets...\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ 
            command: "dom-query", 
            payload: { 
                url, 
                selector: "script[src], link[rel='stylesheet']" 
            } 
        });

        if (!resp || resp.error) {
            return o + formatError("DOM_FAILURE", resp?.error || "Could not access page DOM.", "Make sure the tab is active and finished loading.");
        }

        const assets = resp.data || [];
        const ins = [];
        const unminified = [];

        assets.forEach(asset => {
            const src = asset.attributes.src || asset.attributes.href;
            if (!src) return;

            // Simple heuristic: if it doesn't contain .min. and is not a data URI
            if (!src.includes(".min.") && !src.startsWith("data:") && !src.includes("chrome-extension:")) {
                unminified.push(src);
            }
        });

        if (unminified.length === 0) {
            o += `${ANSI.green}All assets seem properly minified.${ANSI.reset}\n`;
            ins.push({ level: "PASS", text: "No unminified scripts or stylesheets detected in the active tab." });
        } else {
            o += `${ANSI.yellow}Found ${unminified.length} potentially unminified assets:${ANSI.reset}\n`;
            unminified.slice(0, 5).forEach(src => {
                const filename = src.split('/').pop().split('?')[0];
                o += `  ${ANSI.dim}▪${ANSI.reset} ${filename}\n`;
            });
            if (unminified.length > 5) {
                o += `  ${ANSI.dim}... and ${unminified.length - 5} more.${ANSI.reset}\n`;
            }
            ins.push({ level: "WARN", text: `${unminified.length} assets are missing '.min' in their filename. This may impact load performance.` });
        }

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to run minification audit.");
    }
}
