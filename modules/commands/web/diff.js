/**
 * @module modules/commands/web/diff.js
 * @description Comparison utility for two domains.
 */

import {ANSI, insights, formatError, cmdUsage} from "../../formatter.js";

export async function cmdDiff(args) {
    if (args.length < 2) return cmdUsage("diff", "<domain1> <domain2>");

    const d1 = args[0];
    const d2 = args[1];

    let o = `> diff ${d1} ${d2} (comparing DNS A records)\n\n`;

    try {
        // We use a simplified comparison for the release version
        const [r1, r2] = await Promise.all([
            chrome.runtime.sendMessage({ command: "dns", payload: { domain: d1, type: "A" } }),
            chrome.runtime.sendMessage({ command: "dns", payload: { domain: d2, type: "A" } })
        ]);

        const a1 = r1?.data?.records?.map(r => r.address).sort() || [];
        const a2 = r2?.data?.records?.map(r => r.address).sort() || [];

        o += `${ANSI.cyan}${d1}${ANSI.reset} -> ${a1.join(", ") || "(none)"}\n`;
        o += `${ANSI.cyan}${d2}${ANSI.reset} -> ${a2.join(", ") || "(none)"}\n\n`;

        const ins = [];
        if (JSON.stringify(a1) === JSON.stringify(a2)) {
            o += `${ANSI.green}Targets match.${ANSI.reset}\n`;
            ins.push({ level: "PASS", text: "Both domains resolve to the same IP set. Likely behind the same load balancer or CDN." });
        } else {
            o += `${ANSI.yellow}Targets differ.${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "Domains point to different infrastructure endpoints." });
        }

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to compare domains.");
    }
}
