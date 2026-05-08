import { ANSI, insights, resolveBaseDomain } from "../../formatter.js";
import { normTxt } from "./utils.js";

export async function cmdDeliverability(args) {
    const { baseDomain, error } = resolveBaseDomain(args, "deliverability");
    if (error) return error;

    let o = `> email-deliverability-check ${baseDomain}\n\n`;

    const [mxR, txtR, dmarcR] = await Promise.all([
        chrome.runtime.sendMessage({command:"dns",payload:{domain:baseDomain,type:"MX"}}),
        chrome.runtime.sendMessage({command:"dns",payload:{domain:baseDomain,type:"TXT"}}),
        chrome.runtime.sendMessage({command:"dns",payload:{domain:`_dmarc.${baseDomain}`,type:"TXT"}}),
    ]);

    const mxAns = mxR?.data?.Answer?.filter(r=>r.type===15) || [];
    const txtAns = txtR?.data?.Answer || [];
    const spfRec = txtAns.find(r => normTxt(r).toLowerCase().startsWith("v=spf1"));
    const dmarcAns = dmarcR?.data?.Answer || [];
    const dmarcRec = dmarcAns.find(r => normTxt(r).toLowerCase().startsWith("v=dmarc1"));

    const ins = [];
    
    if (!mxAns.length) {
        ins.push({level:"CRIT",text:"No MX records found. The domain cannot receive emails."});
    }

    if (!spfRec) {
        ins.push({level:"CRIT",text:"Missing SPF record. Emails will likely go to spam."});
        ins.push({level:"INFO",text:"Action: Add a TXT record with 'v=spf1 include:_spf.google.com ~all' (or your provider)."});
    } else {
        const spfTxt = normTxt(spfRec).toLowerCase();
        if (spfTxt.includes("+all")) {
            ins.push({level:"CRIT",text:"SPF ends with '+all', allowing anyone to spoof your domain!"});
            ins.push({level:"INFO",text:"Action: Change '+all' to '-all' (fail) or '~all' (softfail)."});
        } else if (!spfTxt.includes("-all") && !spfTxt.includes("~all")) {
            ins.push({level:"WARN",text:"SPF does not define a clear fail policy (missing -all or ~all)."});
        }
        const includes = spfTxt.split(" ").filter(p => p.startsWith("include:"));
        if (includes.length > 10) {
            ins.push({level:"WARN",text:"Too many DNS lookups in SPF (>10). Some receivers will fail SPF."});
        }
    }

    const allSpfs = txtAns.filter(r => normTxt(r).toLowerCase().startsWith("v=spf1"));
    if (allSpfs.length > 1) {
        ins.push({level:"CRIT",text:`Multiple SPF records found (${allSpfs.length}). This invalidates SPF.`});
        ins.push({level:"INFO",text:"Action: Merge all 'include:' mechanisms into a single SPF record."});
    }

    if (!dmarcRec) {
        ins.push({level:"WARN",text:"Missing DMARC record. Domain is vulnerable to spoofing."});
        ins.push({level:"INFO",text:`Action: Add TXT record to _dmarc.${baseDomain} with 'v=DMARC1; p=none; rua=mailto:admin@${baseDomain}'`});
    } else {
        const dmarcTxt = normTxt(dmarcRec).toLowerCase();
        if (dmarcTxt.includes("p=none")) {
            ins.push({level:"WARN",text:"DMARC policy is 'none'. Spoofed emails will still be delivered."});
            ins.push({level:"INFO",text:"Action: Gradually move to 'p=quarantine' or 'p=reject' once you confirm legitimate senders pass."});
        } else if (dmarcTxt.includes("p=quarantine") || dmarcTxt.includes("p=reject")) {
            ins.push({level:"PASS",text:`DMARC policy is strict (${dmarcTxt.includes("p=reject") ? "reject" : "quarantine"}). Excellent protection.`});
        }
        if (!dmarcTxt.includes("rua=")) {
            ins.push({level:"WARN",text:"No 'rua' tag in DMARC. You won't receive aggregate reports about spoofing."});
        }
    }

    if (ins.length === 0) {
        ins.push({level:"PASS",text:"All basic email authentication records (SPF, DMARC) look optimal."});
    }

    o += insights(ins);
    return o;
}
