/**
 * @module modules/commands/web/curl.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - getHTTPErrorInsight from '../../data/http-errors.js'
 * - Exports: cmdCurl
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { getHTTPErrorInsight } from "../../data/http-errors.js";

// ===================================================================
//  curl — HTTP Headers
// ===================================================================

export async function cmdCurl(args) {
    const filtered = args.filter(a => a!=="-I"&&a!=="-i");
    const info = {};
    const url = resolveTargetDomain(filtered[0], info);
    if (!url) return cmdUsage("curl", "<url>");

    const resp = await chrome.runtime.sendMessage({command:"http-headers",payload:{url}});
    if (!resp) return formatError("NO_RESPONSE", "Background worker did not respond.", "Reload the extension.");
    if (resp.error) {
        if (resp.error === "Command cancelled.") return `${ANSI.yellow}^C${ANSI.reset}`;
        return formatError("HTTP_FAILURE", resp.error, "Check the domain and your connection.");
    }

    const {status,statusText,headers} = resp.data;
    let o = "";
    o += `> curl -I https://${url}\n`;

    const sc = status<300?ANSI.green:status<400?ANSI.yellow:ANSI.red;
    o += `${sc}HTTP/2 ${status} ${statusText}${ANSI.reset}\n`;
    for (const [k,v] of Object.entries(headers)) o += `${k}: ${v}\n`;

    o += insights(curlInsights(status, headers, url));
    return o;
}

function curlInsights(status, h, url) {
    const ins = [];

    // ITIL-style HTTP error mapping for status codes ≥ 400
    const httpErr = getHTTPErrorInsight(status);
    if (httpErr) {
        ins.push({ level: httpErr.level, text: `${status} ${httpErr.label}: ${httpErr.insight}` });
    } else if (status >= 500) {
        ins.push({ level: "CRIT", text: `Server error (${status}).` });
    } else if (status >= 400) {
        ins.push({ level: "WARN", text: `Client error (${status}).` });
    } else if (status >= 300 && status < 400) {
        ins.push({ level: "INFO", text: `Redirect → ${h["location"] || "?"}` });
    } else if (status === 200) {
        ins.push({ level: "PASS", text: "200 OK." });
    }

    if (!h["strict-transport-security"]) ins.push({level:"WARN",text:"No HSTS — SSL stripping risk."});
    else ins.push({level:"PASS",text:"HSTS enabled."});
    if (!h["content-security-policy"]) ins.push({level:"WARN",text:"No CSP — XSS risk."});
    else ins.push({level:"PASS",text:"CSP present."});
    if (!h["x-frame-options"]) ins.push({level:"WARN",text:"No X-Frame-Options — clickjacking."});
    if (!h["x-content-type-options"]) ins.push({level:"WARN",text:"No X-Content-Type-Options."});
    if (h["server"]) ins.push({level:"INFO",text:`Server: ${h["server"]}`});
    if (h["x-powered-by"]) ins.push({level:"WARN",text:`X-Powered-By exposed: ${h["x-powered-by"]}`});
    ins.push({level:"INFO",text:`Test HTTP Headers: https://securityheaders.com/?q=${encodeURIComponent(url)}`});
    return ins;
}
