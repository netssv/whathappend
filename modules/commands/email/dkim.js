import { ANSI, insights, resolveBaseDomain } from "../../formatter.js";
import { loadDKIMDB, getAllDKIMSelectors, identifyDKIMProvider } from "./utils.js";

// ===================================================================
//  dkim
// ===================================================================

export async function cmdDKIM(args) {
    const { baseDomain: base, error } = resolveBaseDomain(args, "dkim");
    if (error) return error;

    const dkimDB = await loadDKIMDB();
    const allSel = getAllDKIMSelectors(dkimDB);

    let o = `> dkim-scan ${base} (${allSel.length} selectors)\n`;

    const results = await Promise.all(
        allSel.map(sel =>
            chrome.runtime.sendMessage({command:"dns",payload:{domain:`${sel}._domainkey.${base}`,type:"TXT"}})
                .then(r => ({sel, found: !!(r.data?.Answer?.length), data: r.data?.Answer?.[0]?.data || ""}))
        )
    );

    const found = results.filter(r=>r.found);
    if (found.length) {
        for (const d of found) {
            const prov = identifyDKIMProvider(d.sel, dkimDB);
            o += `${ANSI.green}✓${ANSI.reset} ${d.sel}._domainkey.${base}`;
            if (prov) o += `  ${ANSI.dim}(${prov})${ANSI.reset}`;
            o += `\n`;
        }
    } else {
        o += `${ANSI.dim}(none found)${ANSI.reset}\n`;
    }

    const ins = [];
    if (found.length) {
        ins.push({level:"PASS",text:`${found.length} DKIM selector(s) found.`});
        const provs = [...new Set(found.map(d=>identifyDKIMProvider(d.sel, dkimDB)).filter(Boolean))];
        if (provs.length) ins.push({level:"INFO",text:`Providers: ${provs.join(", ")}`});
    } else {
        ins.push({level:"WARN",text:"No DKIM selectors found across all providers."});
        ins.push({level:"INFO",text:"Email may still work but won't pass DKIM verification."});
    }

    ins.push({level:"INFO",text:`Test DKIM: https://mxtoolbox.com/dkim.aspx`});

    o += insights(ins);
    return o;
}
