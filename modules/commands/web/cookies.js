import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError, workerError, toApex } from "../../formatter.js";

// ===================================================================
//  cookies — Privacy Audit
// ===================================================================

export async function cmdCookies(args) {
    const info = {};
    const t = resolveTargetDomain(args[0], info);
    if (!t) return cmdUsage("cookies", "<domain>");
    
    let o = `> curl -I -s https://${t} | grep -i set-cookie\n`;
    
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
        
        // Build table
        o += `\n  ${ANSI.white}Name${ANSI.reset}`.padEnd(40) + ` ${ANSI.white}Sec/Http${ANSI.reset}`.padEnd(20) + ` ${ANSI.white}Duration${ANSI.reset}\n`;
        o += `  ${ANSI.dim}` + "━".repeat(70) + `${ANSI.reset}\n`;
        
        for (const c of cookies) {
            const name = c.name.length > 25 ? c.name.substring(0, 22) + "..." : c.name;
            const isSecure = c.secure ? "Yes" : "No";
            const isHttpOnly = c.httpOnly ? "Yes" : "No";
            const flags = `${isSecure}/${isHttpOnly}`;
            
            let duration = "Session";
            if (!c.session && c.expirationDate) {
                const days = Math.round((c.expirationDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                duration = days > 0 ? `${days} days` : "Expired";
            }
            
            // Check for potential session hijacking vulnerabilities
            let nameColor = ANSI.cyan;
            if (c.session && !c.httpOnly) {
                nameColor = ANSI.yellow;
                warnCount++;
            }
            
            o += `  ${nameColor}${name}${ANSI.reset}`.padEnd(40) + ` ${flags}`.padEnd(10) + ` ${ANSI.dim}${duration}${ANSI.reset}\n`;
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
