import {ANSI, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { processSSLAudit } from "../ssl-auditor.js";

// ===================================================================
//  openssl — SSL/TLS Certificate (3s timeout, SSL Labs fallback)
// ===================================================================

export async function cmdOpenSSL(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("openssl", "<domain>");

    // Perform SSL check via background worker (CertSpotter API fallback)
    const fallbackResp = await chrome.runtime.sendMessage({command:"ssl",payload:{domain}});
    
    if (!fallbackResp) return formatError("NO_RESPONSE", "Background worker did not respond.", "Reload the extension.");
    if (fallbackResp.error === "Command cancelled.") return `${ANSI.yellow}^C${ANSI.reset}`;
    
    if (fallbackResp.error) {
        return formatError(
            "SSL_FAILURE",
            fallbackResp.error,
            `Try: ${ANSI.white}ssllabs ${domain}${ANSI.reset} for a deep external scan.`
        );
    }

    const { connectivity, certificate, serverHeaders } = fallbackResp.data;

    if (!connectivity) {
        let o = `${ANSI.red}connect: Connection refused${ANSI.reset}\n`;
        o += formatError("CONNECTION_REFUSED", `HTTPS on ${domain}:443 is unreachable.`, `Try: ${ANSI.white}ssllabs ${domain}${ANSI.reset}`);
        return o;
    }

    if (!certificate) {
        let o = `${ANSI.yellow}SSL Active${ANSI.reset} — HTTPS handshake OK\n`;
        o += `${ANSI.dim}Certificate transparency lookup timed out (CertSpotter).${ANSI.reset}\n`;
        o += `${ANSI.dim}External Check: https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(domain)}${ANSI.reset}\n`;
        return o;
    }

    // Map CertSpotter certificate to the format expected by processSSLAudit
    const resp = {
        success: true,
        parsed: {
            issuer: certificate.issuer,
            subject: certificate.commonName,
            not_before: certificate.notBefore,
            not_after: certificate.notAfter
        }
    };

    const output = processSSLAudit(domain, resp);
    return output + `\n${ANSI.dim}Executed: HTTPS HEAD + Certificate Transparency log${ANSI.reset}`;
}
