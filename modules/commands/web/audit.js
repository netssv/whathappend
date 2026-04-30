/**
 * @module modules/commands/web/audit.js
 * @description Marketing Suite: runs seo, og, alt, and schema sequentially.
 */

import { ANSI, resolveTargetDomain, cmdUsage, cmdError } from "../../formatter.js";
import { cmdSeo } from "./seo.js";
import { cmdOg } from "./og.js";
import { cmdAlt } from "./alt.js";
import { cmdSchema } from "./schema.js";

export async function cmdAudit(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("audit", "<domain>");

    let o = `> audit ${domain}\n`;
    o += `${ANSI.dim}Running Marketing Suite (SEO, OpenGraph, Accessibility, Schema)...${ANSI.reset}\n\n`;

    const commands = [
        { name: "SEO Analysis", fn: cmdSeo },
        { name: "Open Graph Tags", fn: cmdOg },
        { name: "Image Accessibility", fn: cmdAlt },
        { name: "Structured Data", fn: cmdSchema }
    ];

    let hasContextShift = false;

    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        o += `${ANSI.bold}${ANSI.white}━━━ ${cmd.name} ━━━${ANSI.reset}\n\n`;
        try {
            const result = await cmd.fn([domain]);
            let lines = result.split('\n');
            
            // Deduplicate Context Shift notice
            if (result.includes("[NOTICE] Context Shift")) {
                if (hasContextShift) {
                    lines = lines.filter(l => !l.includes("[NOTICE] Context Shift"));
                }
                hasContextShift = true;
            }

            const filteredResult = lines.filter(l => !l.startsWith("> ") && !l.startsWith("Usage:")).join('\n').trim();
            
            o += filteredResult + "\n";
        } catch (err) {
            o += cmdError(`Failed to execute ${cmd.name}: ${err.message}`) + "\n";
        }

        if (i < commands.length - 1) {
            o += "\n";
        }
    }

    return o;
}
