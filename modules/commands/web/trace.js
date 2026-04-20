import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { getHTTPErrorInsight } from "../../data/http-errors.js";

// ===================================================================
//  trace — Redirect Chain
// ===================================================================

export async function cmdTrace(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("trace", "<url>");

    const resp = await chrome.runtime.sendMessage({command:"redirect-trace",payload:{url}});
    if (!resp) return workerError();
    if (resp.error) return cmdError(resp.error);

    const {hops} = resp.data;
    let o = "";
    o += `> curl -L -I https://${url}\n`;

    for (let i=0;i<hops.length;i++) {
        const h=hops[i];
        if (h.error) { o+=`${ANSI.red}${i+1}. ${h.url}\n   ERROR: ${h.error}${ANSI.reset}\n`; continue; }
        const sc = h.status<300?ANSI.green:h.status<400?ANSI.yellow:ANSI.red;
        o += `${sc}${h.status}${ANSI.reset} ${ANSI.dim}${h.url}${ANSI.reset}`;
        if (h.location) o += `\n  ${ANSI.dim}→${ANSI.reset} ${ANSI.cyan}${h.location}${ANSI.reset}`;
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

    ins.push({level:"INFO",text:`Test Redirects: https://httpstatus.io/`});

    o += insights(ins);
    return o;
}
