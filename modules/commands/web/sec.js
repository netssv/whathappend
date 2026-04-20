import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  sec — Security Scorecard
// ===================================================================

export async function cmdSec(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("sec", "<domain>");

    let o = "";
    o += `> curl -I https://${domain} && openssl s_client -connect ${domain}:443\n`;

    const [headR, sslR] = await Promise.all([
        chrome.runtime.sendMessage({command:"http-headers",payload:{url:domain, followRedirects: true}}),
        chrome.runtime.sendMessage({command:"ssl",payload:{domain}}),
    ]);

    const ins = [];
    let pass=0, fail=0;

    function check(label, ok, detail) {
        if (ok) { o += `  ${ANSI.green}✓${ANSI.reset} ${label}  ${ANSI.dim}${detail||''}${ANSI.reset}\n`; pass++; }
        else { o += `  ${ANSI.red}✗${ANSI.reset} ${label}  ${ANSI.dim}${detail||''}${ANSI.reset}\n`; fail++; }
    }

    if (sslR.data?.certificate) {
        const notAfter = sslR.data.certificate.notAfter;
        let isOk = false;
        let text = "Unknown date";
        if (notAfter && notAfter !== "Unknown") {
            const dl = Math.floor((new Date(notAfter) - new Date()) / 864e5);
            if (!isNaN(dl)) {
                isOk = dl > 0;
                text = dl > 0 ? `${dl}d remaining` : "EXPIRED";
            }
        }
        check("SSL", isOk, text);
    } else {
        check("SSL", sslR.data?.connectivity, sslR.data?.connectivity?"No CT data":"Unreachable");
    }

    if (headR.data) {
        const h = headR.data.headers;
        
        const hasHSTS = !!h["strict-transport-security"];
        check("HSTS", hasHSTS);
        if (!hasHSTS) ins.push({level:"WARN",text:"Missing HSTS (Strict-Transport-Security)."});
        
        const hasCSP = !!h["content-security-policy"];
        check("CSP", hasCSP);
        if (!hasCSP) ins.push({level:"WARN",text:"Missing CSP (Content-Security-Policy)."});
        
        const hasXFrame = !!h["x-frame-options"];
        check("X-Frame", hasXFrame);
        if (!hasXFrame) ins.push({level:"WARN",text:"Missing X-Frame-Options (Clickjacking risk)."});
        
        const hasXCTO = !!h["x-content-type-options"];
        check("X-CTO", hasXCTO);
        if (!hasXCTO) ins.push({level:"WARN",text:"Missing X-Content-Type-Options (MIME sniffing)."});
        
        const hasRefPol = !!h["referrer-policy"];
        check("Ref-Pol", hasRefPol);
        if (!hasRefPol) ins.push({level:"WARN",text:"Missing Referrer-Policy."});
        
        const hasPermsPol = !!h["permissions-policy"];
        check("Perms-Pol", hasPermsPol);
        if (!hasPermsPol) ins.push({level:"WARN",text:"Missing Permissions-Policy."});

        if (h["server"]) ins.push({level:"INFO",text:`Server: ${h["server"]}`});
        if (h["x-powered-by"]) ins.push({level:"WARN",text:`X-Powered-By exposed: ${h["x-powered-by"]}`});
    } else {
        o += `  ${ANSI.red}HTTP request failed.${ANSI.reset}\n`;
    }

    o += `\n  ${ANSI.white}Score: ${pass}/${pass+fail}${ANSI.reset}\n`;

    if (fail===0) {
        ins.unshift({level:"PASS",text:"All security checks passed."});
    } else {
        if (fail<=2) ins.unshift({level:"WARN",text:`${fail} issue(s) found.`});
        else ins.unshift({level:"CRIT",text:`${fail} security issues.`});
        ins.push({level:"INFO",text:`Deep header analysis: https://securityheaders.com/?q=${encodeURIComponent(domain)}&followRedirects=on`});
    }

    o += insights(ins);
    return o;
}
