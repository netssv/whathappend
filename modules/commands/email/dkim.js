import { ANSI, insights, resolveBaseDomain } from "../../formatter.js";
import { getPossibleSelectors } from "./dkim-discovery.js";
import { normTxt } from "./utils.js";

// ===================================================================
//  dkim
// ===================================================================

export async function cmdDKIM(args) {
    const { baseDomain: base, error } = resolveBaseDomain(args, "dkim");
    if (error) return error;

    let manualSel = args.find(a => a !== base && !a.startsWith("-"));
    let sels = [];

    if (manualSel) {
        sels = [manualSel];
    } else {
        const [mxR, txtR] = await Promise.all([
            chrome.runtime.sendMessage({command:"dns", payload:{domain:base, type:"MX"}}),
            chrome.runtime.sendMessage({command:"dns", payload:{domain:base, type:"TXT"}})
        ]);

        const mxData = mxR?.data?.Answer?.map(r => r.data) || [];
        const spfRec = (txtR?.data?.Answer || []).find(r => normTxt(r).toLowerCase().startsWith("v=spf1"));
        const spfData = spfRec ? normTxt(spfRec).split(" ").filter(p => p.startsWith("include:")).map(p => p.slice(8)) : [];
        sels = getPossibleSelectors(mxData, spfData);
    }

    let o = `> dkim-scan ${base} (${manualSel ? 'manual' : 'dynamic'}: ${sels.length} selectors)\n`;

    const results = await Promise.all(sels.map(s => checkSel(s, base)));
    const found = results.filter(Boolean);

    for (const d of found) {
        o += `${ANSI.green}✓${ANSI.reset} ${d.domain}`;
        if (d.prov) o += `  ${ANSI.dim}(${d.prov})${ANSI.reset}`;
        o += `\n`;
    }

    o += insights(buildInsights(found, base));
    return o;
}

async function checkSel(sel, base) {
    const domain = `${sel}._domainkey.${base}`;
    let curr = domain;
    let prov = null;

    for (let depth = 0; depth < 3; depth++) {
        let r = await chrome.runtime.sendMessage({command:"dns", payload:{domain:curr, type:"TXT"}});
        let ans = r?.data?.Answer?.[0];

        if (!ans) {
            const rc = await chrome.runtime.sendMessage({command:"dns", payload:{domain:curr, type:"CNAME"}});
            ans = rc?.data?.Answer?.[0];
            if (!ans) return depth > 0 ? { sel, domain, prov } : null;
        }

        const dataStr = ans.data || "";
        if (ans.type === 5 || (dataStr && !dataStr.includes("v=DKIM1"))) {
            curr = dataStr.replace(/["']/g, '').trim();
            prov = `CNAME ➝ ${curr}`;
        } else {
            return { sel, domain, prov };
        }
    }
    return prov ? { sel, domain, prov } : null;
}

function buildInsights(found, base) {
    const ins = [];
    if (!found.length) {
        ins.push({level:"WARN", text:"No DKIM selectors found automatically."});
        ins.push({level:"INFO", text:`Know your selector? Run 'dkim ${base} <selector>'`});
    } else {
        ins.push({level:"PASS", text:`${found.length} DKIM selector(s) found.`});
        const provs = [...new Set(found.map(d => d.prov).filter(Boolean))];
        if (provs.length) ins.push({level:"INFO", text:`Providers: ${provs.join(", ")}`});
    }
    ins.push({level:"INFO", text:`Test DKIM: https://mxtoolbox.com/dkim.aspx`});
    return ins;
}
