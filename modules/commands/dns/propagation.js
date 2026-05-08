import { ANSI, insights, resolveTargetDomain } from "../../formatter.js";

const DOH_PROVIDERS = [
    { name: "Google (Global)", url: "https://dns.google/resolve" },
    { name: "Cloudflare (Global)", url: "https://cloudflare-dns.com/dns-query" },
    { name: "OpenDNS (Global)", url: "https://doh.opendns.com/dns-query" }
];

export async function cmdPropagation(args, { opts } = {}) {
    let domain = args[0] || resolveTargetDomain(null);
    let type = (args[1] || "A").toUpperCase();
    if (["A", "AAAA", "MX", "TXT", "CNAME", "NS"].indexOf(type) === -1 && args[1]) {
        domain = args[1];
        type = args[0].toUpperCase();
    }
    if (!domain) return `${ANSI.red}Missing domain.${ANSI.reset}`;

    let o = `> global-resolve ${domain} type=${type}\n\n`;
    
    const promises = DOH_PROVIDERS.map(async (provider) => {
        try {
            // 3 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const res = await fetch(`${provider.url}?name=${domain}&type=${type}`, {
                headers: { "Accept": "application/dns-json" },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error("HTTP error");
            const data = await res.json();
            return { name: provider.name, data: data.Answer || [] };
        } catch (e) {
            return { name: provider.name, error: true };
        }
    });

    const results = await Promise.all(promises);
    let fullyPropagated = true;
    
    let state = null; // "found" or "nxdomain"
    let allIps = new Set();
    let hasDifferingAnswers = false;

    for (const r of results) {
        if (r.error) {
            o += `  ${ANSI.dim}${r.name.padEnd(20)} [ERR] Timeout or failed${ANSI.reset}\n\n`;
            continue; // Ignore failed nodes in the propagation logic
        }
        
        if (!r.data || r.data.length === 0) {
            o += `  ${ANSI.yellow}${r.name.padEnd(20)} [NX] Not found${ANSI.reset}\n\n`;
            if (state === "found") fullyPropagated = false;
            state = "nxdomain";
        } else {
            o += `  ${ANSI.green}${r.name}${ANSI.reset}\n`;
            
            // Map the data to a clean string so we can compare across providers
            const ansStr = r.data.map(a => a.data).join("|");
            if (state === "nxdomain") fullyPropagated = false;
            state = "found";
            
            if (allIps.size > 0 && !allIps.has(ansStr)) {
                hasDifferingAnswers = true;
            }
            allIps.add(ansStr);
            
            for (const record of r.data) {
                o += `    ${ANSI.dim}↪${ANSI.reset} ${record.data}\n`;
            }
            o += `\n`;
        }
    }

    o += `\n`;
    const ins = [];
    
    if (fullyPropagated) {
        if (state === "nxdomain") {
            ins.push({ level: "WARN", text: "DNS is universally returning NXDOMAIN (Not Found)." });
        } else if (state === "found") {
            ins.push({ level: "PASS", text: "DNS records are propagated across responsive global nodes." });
            if (hasDifferingAnswers) {
                ins.push({ level: "INFO", text: "Values differ across regions. This is normal for GeoDNS / CDNs." });
            }
        } else {
            ins.push({ level: "CRIT", text: "All global nodes failed or timed out." });
        }
    } else {
        ins.push({ level: "WARN", text: "DNS propagation is incomplete or inconsistent across regions." });
    }

    ins.push({ level: "INFO", text: `External Check: https://www.whatsmydns.net/#${type}/${domain}` });
    
    o += insights(ins);
    return o;
}
