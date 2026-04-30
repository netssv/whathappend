/**
 * @module modules/commands/web/csp.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage from '../../formatter.js'
 * - Exports: cmdCsp
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

// ===================================================================
//  csp — Content-Security-Policy Analyzer
// ===================================================================

export async function cmdCsp(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("csp", "<url>");

    let o = `> curl -I https://${url} | grep -i 'content-security-policy'\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "http-headers", payload: { url } });
        if (!resp || resp.error) {
            return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch headers.", "Check the domain and your connection.");
        }

        const headers = resp.data.headers;
        const cspRaw = headers["content-security-policy"] || headers["content-security-policy-report-only"];
        const isReportOnly = !headers["content-security-policy"] && !!headers["content-security-policy-report-only"];

        const ins = [];

        if (!cspRaw) {
            o += `${ANSI.red}Content-Security-Policy header is missing.${ANSI.reset}\n`;
            ins.push({ level: "CRIT", text: "No CSP header detected. The site is vulnerable to Cross-Site Scripting (XSS)." });
            ins.push({ level: "INFO", text: `External Check: https://csp-evaluator.withgoogle.com/?csp=https://${url}` });
            o += insights(ins);
            return o;
        }

        if (isReportOnly) {
            o += `${ANSI.yellow}Analyzing Content-Security-Policy-Report-Only...${ANSI.reset}\n\n`;
            ins.push({ level: "WARN", text: "CSP is in Report-Only mode. It monitors violations but does NOT block attacks." });
        } else {
            o += `${ANSI.dim}Analyzing CSP Policy...${ANSI.reset}\n\n`;
        }

        // Parse CSP into directives
        const directives = cspRaw.split(';').map(d => d.trim()).filter(d => d.length > 0);
        const parsedCsp = {};
        
        directives.forEach(d => {
            const parts = d.split(/\s+/);
            const name = parts[0].toLowerCase();
            const values = parts.slice(1);
            parsedCsp[name] = values;
        });

        // Print directives
        directives.forEach(d => {
            const parts = d.split(/\s+/);
            const name = parts[0];
            const values = parts.slice(1);
            
            o += `  ${ANSI.white}${ANSI.bold}${name}${ANSI.reset}\n`;
            
            if (values.length > 0) {
                // Group values to prevent ugly terminal wrapping
                let chunked = [];
                for (let i = 0; i < values.length; i += 3) {
                    chunked.push(values.slice(i, i + 3).join(" "));
                }
                
                chunked.forEach(chunk => {
                    let formatted = chunk;
                    // Highlight dangerous keywords
                    formatted = formatted.replace(/'unsafe-inline'/gi, `${ANSI.red}'unsafe-inline'${ANSI.reset}`);
                    formatted = formatted.replace(/'unsafe-eval'/gi, `${ANSI.red}'unsafe-eval'${ANSI.reset}`);
                    formatted = formatted.replace(/\*/g, `${ANSI.yellow}*${ANSI.reset}`);
                    
                    o += `    ${ANSI.dim}▪${ANSI.reset} ${formatted}\n`;
                });
            } else {
                o += `    ${ANSI.dim}▪ (empty)${ANSI.reset}\n`;
            }
        });

        o += "\n";

        // Analyze for vulnerabilities
        const hasScriptSrc = parsedCsp["script-src"];
        const hasDefaultSrc = parsedCsp["default-src"];
        const hasObjectSrc = parsedCsp["object-src"];
        const hasBaseUri = parsedCsp["base-uri"];

        let isVulnerable = false;

        // Check script-src
        const scriptSources = hasScriptSrc || hasDefaultSrc || [];
        if (scriptSources.length === 0) {
            ins.push({ level: "WARN", text: "No default-src or script-src defined. Scripts can be loaded from anywhere." });
            isVulnerable = true;
        } else {
            if (scriptSources.includes("'unsafe-inline'")) {
                ins.push({ level: "CRIT", text: "'unsafe-inline' in script-src allows execution of malicious injected scripts (XSS)." });
                isVulnerable = true;
            }
            if (scriptSources.includes("'unsafe-eval'")) {
                ins.push({ level: "WARN", text: "'unsafe-eval' allows dynamic code execution, increasing the risk of DOM XSS." });
            }
            if (scriptSources.includes("*") || scriptSources.includes("http:")) {
                ins.push({ level: "WARN", text: "Wildcard (*) or HTTP sources in script-src allow loading untrusted scripts." });
            }
        }

        // Check object-src
        if (!hasObjectSrc) {
            ins.push({ level: "WARN", text: "Missing object-src. Allows injection of Flash/Java plugins to bypass CSP." });
        } else if (!hasObjectSrc.includes("'none'")) {
            ins.push({ level: "WARN", text: "object-src is not 'none'. Make sure it's strictly necessary." });
        }

        // Check base-uri
        if (!hasBaseUri) {
            ins.push({ level: "INFO", text: "Missing base-uri. Attackers could inject <base> tags to hijack relative URLs." });
        }

        if (!isVulnerable && hasScriptSrc && !scriptSources.includes("'unsafe-inline'")) {
            ins.push({ level: "PASS", text: "CSP seems strong against basic XSS injection." });
        }

        ins.push({ level: "INFO", text: `External Check: https://csp-evaluator.withgoogle.com/?csp=https://${url}` });

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to analyze CSP header.");
    }
}
