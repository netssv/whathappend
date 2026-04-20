import {ANSI, insights, resolveBaseDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { normTxt } from "./utils.js";

// ===================================================================
//  dmarc
// ===================================================================

export async function cmdDMARC(args) {
    const { baseDomain: base, error } = resolveBaseDomain(args, "dmarc");
    if (error) return error;

    const resp = await chrome.runtime.sendMessage({command:"dns",payload:{domain:`_dmarc.${base}`,type:"TXT"}});
    if (!resp||resp.error) return cmdError(resp?.error||"DNS query failed");

    let o = `> dig _dmarc.${base} txt +short\n`;
    const txtAns = resp.data?.Answer || [];
    const rec = txtAns.find(r => normTxt(r).toLowerCase().startsWith("v=dmarc1"));

    if (rec) {
        const val = normTxt(rec);
        o += `${val}\n`;
        const ins = [{level:"PASS",text:"DMARC record found."}];
        if (val.includes("p=reject")) ins.push({level:"PASS",text:"Reject policy — unauthorized mail is rejected."});
        else if (val.includes("p=quarantine")) ins.push({level:"PASS",text:"Quarantine policy — unauthorized mail goes to spam."});
        else if (val.includes("p=none")) ins.push({level:"WARN",text:"None policy — DMARC is monitoring only."});
        if (val.includes("rua=")) ins.push({level:"INFO",text:"Aggregate reports configured."});
        ins.push({level:"INFO",text:`Test DMARC: https://mxtoolbox.com/dmarc/${base}`});
        o += insights(ins);
    } else {
        o += `${ANSI.dim}(not found)${ANSI.reset}\n`;
        o += insights([{level:"WARN",text:"No DMARC — spoofed emails bypass filters."}]);
    }
    return o;
}
