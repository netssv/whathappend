import {ANSI, insights, resolveBaseDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { normTxt } from "./utils.js";

// ===================================================================
//  spf
// ===================================================================

export async function cmdSPF(args) {
    const { baseDomain: base, error } = resolveBaseDomain(args, "spf");
    if (error) return error;

    const resp = await chrome.runtime.sendMessage({command:"dns",payload:{domain:base,type:"TXT"}});
    if (!resp||resp.error) return cmdError(resp?.error||"DNS query failed");

    let o = `> dig ${base} txt +short | grep spf\n`;
    const txtAns = resp.data?.Answer || [];
    const spf = txtAns.find(r => normTxt(r).toLowerCase().startsWith("v=spf1"));

    if (spf) {
        const val = normTxt(spf);
        o += `${val}\n`;
        const ins = [{level:"PASS",text:"SPF record found."}];
        if (val.includes("-all")) ins.push({level:"INFO",text:"Strict policy (-all). Unauthorized senders rejected."});
        else if (val.includes("~all")) ins.push({level:"INFO",text:"Soft fail (~all). Unauthorized senders marked."});
        else if (val.includes("+all") || val.includes("?all")) ins.push({level:"WARN",text:"Permissive policy. Anyone can send as this domain."});
        ins.push({level:"INFO",text:`External Check: https://mxtoolbox.com/spf/${base}`});
        o += insights(ins);
    } else {
        o += `${ANSI.dim}(not found)${ANSI.reset}\n`;
        o += insights([
            {level:"CRIT",text:"Anyone can spoof emails from this domain."},
            {level:"INFO",text:`External Check: https://mxtoolbox.com/spf/${base}`}
        ]);
    }
    return o;
}
