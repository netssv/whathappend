import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  host — A + AAAA + MX
// ===================================================================

export async function cmdHost(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("host", "<domain>");

    let aR, aaaaR, mxR;
    try {
        [aR, aaaaR, mxR] = await Promise.all([
            chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"A"}}),
            chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"AAAA"}}),
            chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"MX"}}),
        ]);
    } catch (err) {
        return cmdError(` DNS queries failed: ${err.message}`);
    }

    let o = "";
    o += `> host ${domain}\n`;

    let found = false;

    if (aR.data?.Answer) {
        for (const r of aR.data.Answer) {
            if (r.type === 5) { o += `${domain} is an alias for ${r.data}\n`; found = true; }
        }
    }
    if (aR.data?.Answer) {
        for (const r of aR.data.Answer) {
            if (r.type === 1) { o += `${domain} has address ${r.data}\n`; found = true; }
        }
    }
    if (aaaaR.data?.Answer) {
        for (const r of aaaaR.data.Answer) {
            if (r.type === 28) { o += `${domain} has IPv6 address ${r.data}\n`; found = true; }
        }
    }
    if (mxR.data?.Answer) {
        for (const r of mxR.data.Answer) {
            if (r.type === 15) { o += `${domain} mail is handled by ${r.data}\n`; found = true; }
        }
    }

    if (!found) {
        if (aR.data?.Status === 3) {
            o += `${ANSI.red}Host ${domain} not found: 3(NXDOMAIN)${ANSI.reset}\n`;
            o += `${ANSI.dim}Check status: https://www.isitdownrightnow.com/?url=${encodeURIComponent(domain)}${ANSI.reset}\n`;
        } else o += `${ANSI.yellow}${domain} has no A, AAAA, or MX records.${ANSI.reset}\n`;
    }

    const ins = [];
    const aCount = (aR.data?.Answer||[]).filter(r=>r.type===1).length;
    const mxCount = (mxR.data?.Answer||[]).filter(r=>r.type===15).length;
    if (aCount > 1) ins.push({level:"INFO",text:`${aCount} IPs — load balancing or CDN.`});
    if (mxCount === 0 && found) {
        ins.push({level:"WARN",text:"No mail servers configured. Email delivery will fail."});
        ins.push({level:"INFO",text:`Test MX health: https://mxtoolbox.com/domain/${domain}`});
    }
    else if (mxCount > 0) {
        const mxd = (mxR.data.Answer||[]).map(r=>(r.data||"").toLowerCase());
        if (mxd.some(d=>d.includes("google"))) ins.push({level:"INFO",text:"Mail: Google Workspace."});
        else if (mxd.some(d=>d.includes("microsoft")||d.includes("outlook"))) ins.push({level:"INFO",text:"Mail: Microsoft 365."});
    }
    const firstA = (aR.data?.Answer||[]).find(r=>r.type===1);
    if (firstA) {
        const prov = await resolveProvider((firstA.data||"").trim());
        if (prov) ins.push({level:"INFO",text:`Hosted by ${prov}.`});
    }

    if (ins.length > 0) o += "\n";
    o += insights(ins);
    return o;
}
