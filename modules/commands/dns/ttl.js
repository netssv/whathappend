import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError, toRegisteredDomain } from "../../formatter.js";

// ===================================================================
//  ttl — TTL for all record types
// ===================================================================

export function fmtTTL(s) {
    if (s>=86400) return `${Math.round(s/86400)}d`;
    if (s>=3600) return `${Math.round(s/3600)}h`;
    if (s>=60) return `${Math.round(s/60)}m`;
    return `${s}s`;
}

export async function cmdTTL(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("ttl", "<domain>");

    const types = ["A","AAAA","MX","TXT","NS","SOA","CNAME"];
    const results = await Promise.all(
        types.map(t => chrome.runtime.sendMessage({command:"dns",payload:{domain,type:t}}).then(r=>({type:t,data:r.data})))
    );

    let o = "";
    o += `> dig ${domain} [A/AAAA/MX/TXT/NS/SOA/CNAME]\n`;

    const ins = [];
    for (const r of results) {
        const ans = r.data?.Answer || [];
        if (ans.length) {
            const ttl = ans[0].TTL || 0;
            const color = ttl < 60 ? ANSI.yellow : ttl > 3600 ? ANSI.green : ANSI.white;
            o += `  ${r.type.padEnd(6)} ${color}${fmtTTL(ttl)}${ANSI.reset}\n`;
            if (r.type==="A" && ttl < 60) ins.push({level:"INFO",text:`A TTL=${ttl}s — dynamic DNS or CDN.`});
        } else {
            o += `  ${r.type.padEnd(6)} ${ANSI.dim}-${ANSI.reset}\n`;
            // RFC 1034: apex domains cannot have CNAMEs
            if (r.type === "CNAME" && domain === toRegisteredDomain(domain)) {
                ins.push({level:"INFO",text:"No CNAME at apex — expected per RFC 1034."});
            }
        }
    }

    if (ins.length > 0) o += "\n";
    o += insights(ins);
    return o;
}
