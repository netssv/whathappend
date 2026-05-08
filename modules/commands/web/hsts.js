/**
 * @module modules/commands/web/hsts.js
 * @description HSTS (HTTP Strict Transport Security) Verification.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

export async function cmdHsts(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("hsts", "<url>");

    let o = `> curl -I https://${url} | grep -i 'strict-transport-security'\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "http-headers", payload: { url } });
        if (!resp || resp.error) {
            return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch headers.", "Check the domain and your connection.");
        }

        const headers = resp.data.headers;
        const hsts = headers["strict-transport-security"];
        const ins = [];

        if (!hsts) {
            o += `${ANSI.red}HSTS is not enabled.${ANSI.reset}\n`;
            ins.push({ level: "CRIT", text: "HSTS header is missing. The site is vulnerable to SSL stripping attacks." });
        } else {
            o += `${ANSI.dim}Policy: ${ANSI.reset}${ANSI.white}${hsts}${ANSI.reset}\n\n`;
            
            const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
            const includesSubdomains = /includeSubDomains/i.test(hsts);
            const isPreload = /preload/i.test(hsts);

            if (maxAgeMatch) {
                const seconds = parseInt(maxAgeMatch[1]);
                const days = Math.floor(seconds / 86400);
                o += `  ${ANSI.dim}▪${ANSI.reset} Max Age: ${ANSI.cyan}${days} days${ANSI.reset} (${seconds}s)\n`;
                if (days < 180) {
                    ins.push({ level: "WARN", text: "HSTS max-age is too short. 180+ days (15552000s) is recommended." });
                } else {
                    ins.push({ level: "PASS", text: "HSTS max-age is sufficiently long." });
                }
            }

            if (includesSubdomains) {
                o += `  ${ANSI.dim}▪${ANSI.reset} includeSubDomains: ${ANSI.green}Enabled${ANSI.reset}\n`;
                ins.push({ level: "PASS", text: "HSTS policy covers all subdomains." });
            } else {
                o += `  ${ANSI.dim}▪${ANSI.reset} includeSubDomains: ${ANSI.yellow}Disabled${ANSI.reset}\n`;
                ins.push({ level: "WARN", text: "HSTS does not cover subdomains. Subdomains could be accessed over insecure HTTP." });
            }

            if (isPreload) {
                o += `  ${ANSI.dim}▪${ANSI.reset} Preload: ${ANSI.green}Enabled${ANSI.reset}\n`;
                ins.push({ level: "PASS", text: "The site is signaling its readiness for the HSTS preload list." });
            } else {
                o += `  ${ANSI.dim}▪${ANSI.reset} Preload: ${ANSI.dim}Disabled${ANSI.reset}\n`;
            }
        }

        o += insights(ins);
        o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}https://hstspreload.org/?domain=${url}${ANSI.reset}\n`;
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to analyze HSTS policy.");
    }
}
