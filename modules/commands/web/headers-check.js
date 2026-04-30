/**
 * @module modules/commands/web/headers-check.js
 * @description Batch security header audit.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

export async function cmdHeadersCheck(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("headers-check", "<url>");

    let o = `> auditing security headers for https://${url}...\n\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "http-headers", payload: { url } });
        if (!resp || resp.error) {
            return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch headers.", "Check the domain.");
        }

        const h = resp.data.headers;
        const ins = [];

        const checks = [
            { name: "X-Frame-Options", key: "x-frame-options", crit: true, desc: "Protects against clickjacking." },
            { name: "X-Content-Type-Options", key: "x-content-type-options", crit: false, desc: "Prevents MIME-sniffing." },
            { name: "Referrer-Policy", key: "referrer-policy", crit: false, desc: "Controls referrer info leaked." },
            { name: "Permissions-Policy", key: "permissions-policy", crit: false, desc: "Restricts browser features (camera, geo)." },
        ];

        checks.forEach(c => {
            const val = h[c.key];
            if (val) {
                o += `  ${ANSI.green}✓${ANSI.reset} ${ANSI.white}${c.name}${ANSI.reset}: ${ANSI.dim}${val}${ANSI.reset}\n`;
                ins.push({ level: "PASS", text: `${c.name} is properly configured.` });
            } else {
                o += `  ${ANSI.red}✗${ANSI.reset} ${ANSI.white}${c.name}${ANSI.reset} ${ANSI.dim}is missing${ANSI.reset}\n`;
                ins.push({ level: c.crit ? "CRIT" : "WARN", text: `${c.name} is missing. ${c.desc}` });
            }
        });

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to audit headers.");
    }
}
