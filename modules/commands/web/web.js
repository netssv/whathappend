import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  web — Composite DNS + Headers + SSL
// ===================================================================

export async function cmdWeb(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("web", "<domain>");

    let o = "";

    const [aR, headR, sslR] = await Promise.all([
        chrome.runtime.sendMessage({command:"dns",payload:{domain,type:"A"}}),
        chrome.runtime.sendMessage({command:"http-headers",payload:{url:domain}}),
        chrome.runtime.sendMessage({command:"ssl",payload:{domain}}),
    ]);

    const ins = [];

    // ── DNS A records ──
    o += `> dig ${domain} a +short\n`;
    const aAns = aR.data?.Answer || [];
    if (aAns.length) {
        for (const r of aAns) o += `${r.data||""}\n`;
        const prov = await resolveProvider((aAns[0].data||"").trim());
        if (prov) ins.push({level:"INFO",text:`Hosted by ${prov}.`});
    } else o += `${ANSI.dim}(no records)${ANSI.reset}\n`;

    // ── HTTP Headers ──
    o += `> curl -I https://${domain}\n`;
    if (headR.data) {
        const sc = headR.data.status<300?ANSI.green:headR.data.status<400?ANSI.yellow:ANSI.red;
        o += `${sc}HTTP/2 ${headR.data.status} ${headR.data.statusText}${ANSI.reset}\n`;
        for (const [k,v] of Object.entries(headR.data.headers)) o += `${k}: ${v}\n`;
        ins.push({level:headR.data.status<300?"PASS":"WARN",text:`HTTP ${headR.data.status}.`});

        const sh = headR.data.headers;
        const missing = [];
        if (!sh["strict-transport-security"]) missing.push("HSTS");
        if (!sh["content-security-policy"]) missing.push("CSP");
        if (!sh["x-frame-options"]) missing.push("X-Frame");
        if (!sh["x-content-type-options"]) missing.push("X-CTO");
        if (missing.length) ins.push({level:"WARN",text:`Missing: ${missing.join(", ")}`});
        else ins.push({level:"PASS",text:"All security headers present."});
    } else o += `${ANSI.red}${headR.error||"Failed"}${ANSI.reset}\n`;

    // ── SSL ──
    o += `> openssl s_client -connect ${domain}:443\n`;
    if (sslR.data?.certificate) {
        const cert = sslR.data.certificate;
        o += `subject: CN = ${cert.commonName}\n`;
        o += `issuer: ${cert.issuer}\n`;
        const dl = Math.floor((new Date(cert.notAfter)-new Date())/864e5);
        const ec = dl<0?ANSI.red:dl<30?ANSI.yellow:ANSI.green;
        o += `notBefore: ${cert.notBefore}\n`;
        o += `notAfter: ${ec}${cert.notAfter}${ANSI.reset} (${dl}d)\n`;
        if (dl<0) ins.push({level:"CRIT",text:"SSL EXPIRED."});
        else if (dl<30) ins.push({level:"WARN",text:`SSL expires in ${dl}d.`});
        else ins.push({level:"PASS",text:`SSL valid (${dl}d).`});
    } else if (sslR.data?.connectivity) {
        o += `${ANSI.yellow}Connected but no CT data.${ANSI.reset}\n`;
    } else {
        o += `${ANSI.red}Connection refused${ANSI.reset}\n`;
        ins.push({level:"CRIT",text:"No HTTPS."});
    }

    o += insights(ins);
    return o;
}
