import { ANSI, insights, resolveBaseDomain } from "../../formatter.js";
import { loadDKIMDB, getAllDKIMSelectors, identifyDKIMProvider, normTxt } from "./utils.js";

// ===================================================================
//  email — Composite MX + SPF + DMARC + DKIM
// ===================================================================

export async function cmdEmail(args) {
    const { baseDomain, error } = resolveBaseDomain(args, "email");
    if (error) return error;

    let o = "";

    const [mxR, txtR, dmarcR] = await Promise.all([
        chrome.runtime.sendMessage({command:"dns",payload:{domain:baseDomain,type:"MX"}}),
        chrome.runtime.sendMessage({command:"dns",payload:{domain:baseDomain,type:"TXT"}}),
        chrome.runtime.sendMessage({command:"dns",payload:{domain:`_dmarc.${baseDomain}`,type:"TXT"}}),
    ]);

    // ── MX ──
    o += `> dig ${baseDomain} mx +short\n`;
    const mxAns = mxR?.data?.Answer?.filter(r=>r.type===15) || [];
    if (mxAns.length) {
        for (const r of mxAns) o += `${r.data}\n`;
    } else {
        o += `${ANSI.dim}(no records)${ANSI.reset}\n`;
    }

    // ── SPF ──
    o += `> dig ${baseDomain} txt +short | grep spf\n`;
    const txtAns = txtR?.data?.Answer || [];
    const spfRec = txtAns.find(r => normTxt(r).toLowerCase().startsWith("v=spf1"));
    if (spfRec) {
        o += `${normTxt(spfRec)}\n`;
    } else {
        o += `${ANSI.dim}(not found)${ANSI.reset}\n`;
    }

    // ── DMARC ──
    o += `> dig _dmarc.${baseDomain} txt +short\n`;
    const dmarcAns = dmarcR?.data?.Answer || [];
    const dmarcRec = dmarcAns.find(r => normTxt(r).toLowerCase().startsWith("v=dmarc1"));
    if (dmarcRec) {
        o += `${normTxt(dmarcRec)}\n`;
    } else {
        o += `${ANSI.dim}(not found)${ANSI.reset}\n`;
    }

    // ── DKIM ──
    const dkimDB = await loadDKIMDB();
    const allSel = getAllDKIMSelectors(dkimDB);
    o += `> dkim-scan ${baseDomain} (${allSel.length} selectors)\n`;
    const dkimResults = await Promise.all(
        allSel.map(sel =>
            chrome.runtime.sendMessage({command:"dns",payload:{domain:`${sel}._domainkey.${baseDomain}`,type:"TXT"}})
                .then(r => ({sel, found: !!(r.data?.Answer?.length)}))
        )
    );
    const dkimFound = dkimResults.filter(r=>r.found);
    if (dkimFound.length) {
        for (const d of dkimFound) {
            const prov = identifyDKIMProvider(d.sel, dkimDB);
            o += `${d.sel}._domainkey.${baseDomain}`;
            if (prov) o += `  ${ANSI.dim}(${prov})${ANSI.reset}`;
            o += `\n`;
        }
    } else {
        o += `${ANSI.dim}(none found)${ANSI.reset}\n`;
    }

    // ── Insights ──
    const ins = [];
    if (mxAns.length) {
        ins.push({level:"PASS",text:`${mxAns.length} mail server(s).`});
        const mxd = mxAns.map(r=>(r.data||"").toLowerCase());
        if (mxd.some(d=>d.includes("google"))) ins.push({level:"INFO",text:"Google Workspace."});
        else if (mxd.some(d=>d.includes("outlook")||d.includes("microsoft"))) ins.push({level:"INFO",text:"Microsoft 365."});
    } else { ins.push({level:"CRIT",text:"No MX — email will fail."}); }
    if (spfRec) ins.push({level:"PASS",text:"SPF configured."}); else ins.push({level:"WARN",text:"No SPF."});
    if (dmarcRec) {
        const val = normTxt(dmarcRec);
        if (val.includes("p=reject")) ins.push({level:"PASS",text:"DMARC: reject."});
        else if (val.includes("p=quarantine")) ins.push({level:"PASS",text:"DMARC: quarantine."});
        else if (val.includes("p=none")) ins.push({level:"WARN",text:"DMARC: none (not enforced)."});
        else ins.push({level:"PASS",text:"DMARC configured."});
    } else { ins.push({level:"WARN",text:"No DMARC."}); }
    if (dkimFound.length) ins.push({level:"PASS",text:`DKIM: ${dkimFound.length} selector(s).`});
    else ins.push({level:"WARN",text:"No DKIM found."});

    ins.push({level:"INFO",text:`Test Email Health: https://mxtoolbox.com/emailhealth/${baseDomain}/`});

    o += insights(ins);
    return o;
}
