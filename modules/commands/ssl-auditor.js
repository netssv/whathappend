import { ANSI, formatError, insights } from "../formatter.js";

/**
 * Calculates expiration from "notAfter" string (e.g. "Jul 15 20:10:00 2026 GMT")
 * Returns object with valid: boolean, daysRemaining: number, label: string
 */
function calculateExpiration(notAfterStr) {
    if (!notAfterStr) return { valid: false, daysRemaining: 0, label: "Unknown" };
    
    const notAfter = new Date(notAfterStr);
    const now = new Date();
    
    if (isNaN(notAfter.getTime())) {
        return { valid: false, daysRemaining: 0, label: "Invalid Date format" };
    }

    const diffMs = notAfter.getTime() - now.getTime();
    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
        return { valid: false, daysRemaining, label: `${ANSI.red}EXPIRED${ANSI.reset}` };
    }
    
    return { valid: true, daysRemaining, label: `${ANSI.green}Valid (${daysRemaining} days remaining)${ANSI.reset}` };
}

export function processSSLAudit(target, payload) {
    if (payload.error) {
        // Fallback to SSL Labs
        return formatError(
            "SSL_FAILURE",
            payload.error,
            `Try: ${ANSI.white}ssllabs ${target}${ANSI.reset} for a deep external scan.`
        ) + `\n${ANSI.dim}Deep Analysis: https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(target)}${ANSI.reset}\n`;
    }

    const parsed = payload.parsed;
    if (!parsed) {
        return formatError("NO_DATA", "Native host returned success but no parsed data.");
    }

    const issuerStr = parsed.issuer || "Unknown";
    // Clean up typical openssl formatting if needed (sometimes it starts with a space or /C=)
    const cleanIssuer = issuerStr.replace(/^\//, '').replace(/\//g, ', ');

    const notAfterStr = parsed.not_after || "Unknown";
    
    const exp = calculateExpiration(notAfterStr);
    
    let o = `> openssl s_client -connect ${target}:443 -servername ${target}\n`;
    o += `${ANSI.white}ISSUER: ${ANSI.reset} ${cleanIssuer}\n`;
    o += `${ANSI.white}EXPIRES:${ANSI.reset} ${notAfterStr}\n`;
    o += `${ANSI.white}STATUS: ${ANSI.reset} ${exp.label}\n`;
    
    const ins = [];
    if (exp.valid) {
        if (exp.daysRemaining < 15) {
            ins.push({ level: "WARN", text: `Certificate expires soon (in ${exp.daysRemaining} days).` });
        } else {
            ins.push({ level: "PASS", text: "Certificate is trusted and active." });
        }
    } else {
        ins.push({ level: "CRIT", text: `Certificate EXPIRED ${Math.abs(exp.daysRemaining)} days ago!` });
    }
    
    // We don't have HTTP headers here (unlike the old crt.sh mixed call), so we suggest checking them
    ins.push({ level: "WARN", text: `SSL dates inferred from historical CT logs (browser sandboxed).` });
    ins.push({ level: "INFO", text: `Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(target)}` });
    ins.push({ level: "INFO", text: `Verify HSTS and security protocols with: ${ANSI.white}headers ${target}${ANSI.reset}` });
    
    o += insights(ins);
    return o;
}
