/**
 * @module modules/commands/web/trace.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - getHTTPErrorInsight from '../../data/http-errors.js'
 * - Exports: cmdTrace
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { getHTTPErrorInsight } from "../../data/http-errors.js";

// ===================================================================
//  trace — Redirect Chain
// ===================================================================

export async function cmdTrace(args) {
    let url = args[0];
    let displayUrl = url;
    
    // If no URL provided, fall back to the active tab domain
    if (!url) {
        const info = {};
        url = resolveTargetDomain(null, info);
        if (!url) return cmdUsage("trace", "<url>");
        // Auto-targeted domain, we add https:// for the fetch
        url = "https://" + url;
        displayUrl = url.replace(/^https?:\/\//i, "");
    } else {
        // Keep exactly what the user typed (including protocol if provided)
        displayUrl = url;
    }

    const resp = await chrome.runtime.sendMessage({command:"redirect-trace",payload:{url}});
    if (!resp) return workerError();
    if (resp.error) return cmdError(resp.error);

    const {hops} = resp.data;
    let o = "";
    // If the user didn't type a protocol, curl would usually assume http or https.
    // We display exactly what is fetched.
    o += `> curl -L -I ${hops.length ? hops[0].url : url}\n`;

    for (let i=0;i<hops.length;i++) {
        const h=hops[i];
        if (h.error) { o+=`${ANSI.red}${i+1}. ${h.url}\n   ERROR: ${h.error}${ANSI.reset}\n`; continue; }
        let sc = ANSI.red;
        if (h.status === "META") sc = ANSI.magenta;
        else if (h.status === "REDIRECT") sc = ANSI.blue;
        else if (h.status < 300) sc = ANSI.green;
        else if (h.status < 400) sc = ANSI.yellow;
        
        o += `${sc}${h.status}${ANSI.reset} ${ANSI.dim}${h.url}${ANSI.reset}`;
        if (h.location) o += `\n  ${ANSI.dim}→${ANSI.reset} ${ANSI.cyan}${h.location}${ANSI.reset}`;
        if (h.headers) {
            for (const [k, v] of Object.entries(h.headers)) {
                o += `\n    ${ANSI.dim}${k}:${ANSI.reset} ${ANSI.white}${v}${ANSI.reset}`;
            }
        }
        o += "\n";
    }

    const ins = [];
    if (hops.length <= 1) ins.push({level:"PASS",text:"No redirects. Clean URL."});
    else if (hops.length === 2) ins.push({level:"INFO",text:"1 redirect. Normal (http→https)."});
    else ins.push({level:"WARN",text:`${hops.length-1} redirects. May slow first load.`});

    const hasHTTP = hops.some(h=>h.url?.startsWith("http://"));
    if (hasHTTP) ins.push({level:"WARN",text:"Initial URL is HTTP (not HTTPS)."});

    for (let i = 0; i < hops.length; i++) {
        if (hops[i].status >= 400) {
            const errInfo = getHTTPErrorInsight(hops[i].status);
            if (errInfo) {
                ins.push({level: errInfo.level, text: `HTTP ${hops[i].status} (${errInfo.label}): ${errInfo.insight}`});
            } else {
                ins.push({level: "WARN", text: `HTTP ${hops[i].status} Error.`});
            }
        }
    }

    ins.push({level:"INFO",text:`External 1: https://httpstatus.io/`});
    ins.push({ level: "INFO", text: `External 2: https://wheregoes.com/trace/2026/?url=${displayUrl}` });

    o += insights(ins);
    return o;
}
