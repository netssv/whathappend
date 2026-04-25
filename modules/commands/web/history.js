import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError } from "../../formatter.js";

// ===================================================================
//  history — Certificate Transparency Logs
// ===================================================================

async function fetchCertHistory(target) {
    try {
        const res = await fetch(`https://crt.sh/?q=${target}&output=json`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) return { src: "crt.sh", data: await res.json() };
    } catch (_) {}
    
    const fb = await fetch(`https://api.certspotter.com/v1/issuances?domain=${target}&include_subdomains=false&expand=issuer`);
    if (!fb.ok) throw new Error("APIs failed (HTTP " + fb.status + ")");
    const data = await fb.json();
    return { src: "certspotter", data: data.map(c => ({ not_before: c.not_before, issuer_name: c.issuer?.name || "Unknown" })) };
}

export async function cmdHistory(args) {
    const t = resolveTargetDomain(args[0]);
    if (!t) return cmdUsage("history", "<domain>");
    
    let o = `> history ${t}\n`;
    try {
        const { src, data } = await fetchCertHistory(t);
        o = `> history ${t} (${src})\n`;
        
        if (!data || !data.length) return o + `  ${ANSI.dim}No certificates found.${ANSI.reset}\n`;
        
        const sortedDesc = [...data].sort((a, b) => new Date(b.not_before) - new Date(a.not_before));
        const oldest = sortedDesc[sortedDesc.length - 1];
        
        sortedDesc.slice(0, 5).forEach(c => {
            const date = c.not_before.split("T")[0];
            const issuer = c.issuer_name.match(/O=([^,]+)/)?.[1] || "Unknown CA";
            o += `  ${ANSI.green}✓${ANSI.reset} ${date.padEnd(12)} ${ANSI.cyan}${issuer}${ANSI.reset}\n`;
        });
        
        const ins = [];
        if (oldest) {
            const oldestDate = oldest.not_before.split("T")[0];
            ins.push({ level: "INFO", text: `First infrastructure footprint detected: ${oldestDate}` });
        }
        ins.push({ level: "INFO", text: `View full history: https://crt.sh/?q=${t}` });
        
        return o + insights(ins);
    } catch (e) {
        return o + formatError("FETCH_FAILED", e.message, "Both crt.sh and fallback APIs are unreachable.");
    }
}
