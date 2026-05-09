/**
 * @module modules/commands/web/cookies.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, formatError, workerError, toApex from '../../formatter.js'
 * - Exports: cmdCookies
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError, workerError, toApex } from "../../formatter.js";
import { getTermCols } from "../../state.js";

// ===================================================================
//  cookies — Privacy Audit
// ===================================================================

export async function cmdCookies(args, flags = []) {
    const info = {};
    const domainArg = args[0] || "";
    const t = resolveTargetDomain(domainArg, info);
    if (!t) return cmdUsage("cookies", "[--persist|--keepalive|--stop] <domain>");
    
    // Support --persist / -p, --keepalive / -k, --stop / -s
    const isPersist = flags.includes("--persist") || flags.includes("-p");
    const isKeepAlive = flags.includes("--keepalive") || flags.includes("-k");
    const isStop = flags.includes("--stop") || flags.includes("-s");
    
    let o = `> curl -I -s https://${t} | grep -i set-cookie\n`;

    if (isPersist) {
        o += `\n  ${ANSI.yellow}Initiating cookie persistence sequence...${ANSI.reset}\n`;
        try {
            const resp = await chrome.runtime.sendMessage({
                command: "persist-cookies",
                payload: { domain: toApex(t) || t }
            });
            if (!resp) return o + workerError();
            if (resp.error) return o + formatError("PERSIST_FAILED", resp.error);
            return o + `  ${ANSI.green}Success! Extended lifespan to 1 year for ${resp.count} cookie(s).${ANSI.reset}\n`;
        } catch (e) {
            return o + formatError("EXEC_FAILED", e.message);
        }
    }

    if (isKeepAlive) {
        o += `\n  ${ANSI.yellow}Initializing Keep-Alive Heartbeat...${ANSI.reset}\n`;
        try {
            const resp = await chrome.runtime.sendMessage({
                command: "keep-alive",
                payload: { domain: t, stop: false }
            });
            if (!resp) return o + workerError();
            if (resp.error) return o + formatError("KEEPALIVE_FAILED", resp.error);
            return o + `  ${ANSI.green}Success! Heartbeat active (1 ping / 5 min) for ${t}.${ANSI.reset}\n  ${ANSI.dim}Use 'cookies -stop ${t}' to terminate.${ANSI.reset}\n`;
        } catch (e) {
            return o + formatError("EXEC_FAILED", e.message);
        }
    }

    if (isStop) {
        try {
            await chrome.runtime.sendMessage({
                command: "keep-alive",
                payload: { domain: t, stop: true }
            });
            return o + `\n  ${ANSI.green}Keep-Alive Heartbeat terminated for ${t}.${ANSI.reset}\n`;
        } catch (e) {
            return o + formatError("EXEC_FAILED", e.message);
        }
    }
    
    // Require active tab context or manual domain, but cookies are domain-wide
    // For simplicity, we just ask the background script for cookies for the domain
    
    try {
        const resp = await chrome.runtime.sendMessage({
            command: "get-cookies",
            payload: { domain: toApex(t) || t }
        });
        
        if (!resp) return o + workerError();
        if (resp.error) return o + formatError("FETCH_FAILED", resp.error, "Make sure you have the required permissions.");
        
        const cookies = resp.data || [];
        if (cookies.length === 0) {
            return o + `  ${ANSI.dim}No cookies found for this domain.${ANSI.reset}\n`;
        }
        
        let warnCount = 0;
        
        const cols = getTermCols();
        const isNarrow = cols < 65;
        const nameW = isNarrow ? Math.max(15, cols - 30) : 35;
        const flagsW = 12;
        const barW = Math.min(cols - 4, 70);
        
        // Build table
        o += `\n  ${ANSI.white}${"Name".padEnd(nameW)}${ANSI.reset} ${ANSI.white}${"Sec/Http".padEnd(flagsW)}${ANSI.reset} ${ANSI.white}Duration${ANSI.reset}\n`;
        o += `  ${ANSI.dim}` + "━".repeat(barW) + `${ANSI.reset}\n`;
        
        for (const c of cookies) {
            let name = c.name;
            if (name.length > nameW - 2) name = name.substring(0, nameW - 5) + "...";
            
            const isSecure = c.secure ? "Yes" : "No";
            const isHttpOnly = c.httpOnly ? "Yes" : "No";
            const flags = `${isSecure}/${isHttpOnly}`;
            
            let duration = "Session";
            if (!c.session && c.expirationDate) {
                const days = Math.round((c.expirationDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                duration = days > 0 ? `${days} d` : "Expired";
            }
            
            // Check for potential session hijacking vulnerabilities
            let nameColor = ANSI.cyan;
            if (c.session && !c.httpOnly) {
                nameColor = ANSI.yellow;
                warnCount++;
            }
            
            o += `  ${nameColor}${name.padEnd(nameW)}${ANSI.reset} ${flags.padEnd(flagsW)} ${ANSI.dim}${duration}${ANSI.reset}\n`;
        }
        
        const ins = [];
        if (warnCount > 0) {
            ins.push({ level: "WARN", text: `${warnCount} session cookie(s) missing the HttpOnly flag. Vulnerable to XSS theft.` });
        } else {
            ins.push({ level: "PASS", text: `Found ${cookies.length} cookie(s). No immediate session flags missing.` });
        }
        ins.push({ level: "INFO", text: `External Check: https://themarkup.org/blacklight?url=${t}` });
        return o + insights(ins);
        
    } catch (e) {
        return o + formatError("EXEC_FAILED", e.message, "Could not retrieve cookies.");
    }
}
