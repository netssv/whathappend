/**
 * @module modules/commands/email/email.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveBaseDomain from '../../formatter.js'
 *     - normTxt from './utils.js'
 *     - getPossibleSelectors from './dkim-discovery.js'
 *     - checkSel from './dkim.js'
 * - Exports: cmdEmail
 * - Layer: Command Layer (Email) - Audits SPF, DKIM, DMARC records.
 */

import { ANSI, insights, resolveBaseDomain } from "../../formatter.js";
import { normTxt } from "./utils.js";
import { getPossibleSelectors } from "./dkim-discovery.js";
import { checkSel } from "./dkim.js";

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
    const dkimMxData = mxAns.map(r => r.data || "");
    const dkimSpfData = spfRec ? normTxt(spfRec).split(" ").filter(p => p.startsWith("include:")).map(p => p.slice(8)) : [];
    const sels = getPossibleSelectors(dkimMxData, dkimSpfData);

    o += `> dkim-scan ${baseDomain} (dynamic: ${sels.length} selectors)\n`;
    const dkimResults = await Promise.all(
        sels.map(async sel => {
            const result = await checkSel(sel, baseDomain);
            return result
                ? { sel, found: true, prov: result.prov }
                : { sel, found: false };
        })
    );

    const dkimFound = dkimResults.filter(r => r.found);
    if (dkimFound.length) {
        for (const d of dkimFound) {
            o += `${d.sel}._domainkey.${baseDomain}`;
            if (d.prov) o += `  ${ANSI.dim}(${d.prov})${ANSI.reset}`;
            o += `\n`;
        }
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
    else {
        ins.push({level:"WARN",text:"No DKIM found automatically."});
        ins.push({level:"INFO",text:`Know your selector? Run 'dkim ${baseDomain} <selector>'`});
    }

    ins.push({level:"INFO",text:`External Check: https://mxtoolbox.com/emailhealth/${baseDomain}/`});

    o += insights(ins);
    return o;
}
