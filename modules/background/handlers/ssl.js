/**
 * @module modules/background/handlers/ssl.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 *     - CONFIG from '../../data/constants.js'
 * - Exports: handleSSL
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// SSL Handler — Certificate Information (3s strict timeout)
// ===================================================================

function findLatestCert(certs) {
    let latest = certs[0];
    let maxTime = -Infinity;
    for (const c of certs) {
        if (!c.not_after) continue;
        const t = new Date(c.not_after).getTime();
        if (t > maxTime) {
            maxTime = t;
            latest = c;
        }
    }
    return latest;
}

export async function handleSSL({ domain, abortId }) {
    const signal = createAbort(abortId || `ssl-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        // Run connectivity check and crt.sh in parallel
        const [connectResult, crtResult] = await Promise.allSettled([
            // Fast connectivity check (HEAD)
            (async () => {
                const resp = await fetch(`https://${domain}`, {
                    method: "HEAD", redirect: "manual", signal,
                });
                const headers = {};
                resp.headers.forEach((v, k) => { headers[k] = v; });
                return { ok: true, headers };
            })(),
            // Certificate Transparency lookup (CertSpotter is much faster than crt.sh)
            (async () => {
                const crtCtrl = new AbortController();
                const crtTimer = setTimeout(() => crtCtrl.abort(), 8000);
                try {
                    const crtUrl = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=false&expand=issuer`;
                    const resp = await fetch(crtUrl, {
                        headers: { "Accept": "application/json" },
                        signal: crtCtrl.signal,
                    });
                    clearTimeout(crtTimer);
                    if (!resp.ok) return null;
                    const certs = await resp.json();
                    if (!certs?.length) return null;
                    
                    // Find the cert that expires furthest in the future to avoid false positives
                    // from short-lived or recently revoked certs in the CT logs.
                    const latest = findLatestCert(certs);
                    
                    return {
                        issuer: latest.issuer?.name || "Unknown",
                        commonName: domain,
                        notBefore: latest.not_before || "Unknown",
                        notAfter: latest.not_after || "Unknown",
                        serialNumber: latest.id || "Unknown",
                        entryTimestamp: latest.not_before || "Unknown",
                    };
                } catch (_) {
                    clearTimeout(crtTimer);
                    return null;
                }
            })(),
        ]);

        const connectivity = connectResult.status === "fulfilled" && connectResult.value?.ok;
        const serverHeaders = connectivity ? connectResult.value.headers : {};
        const certData = crtResult.status === "fulfilled" ? crtResult.value : null;

        completeAbort(abortId);
        return {
            success: true,
            data: { domain, connectivity, certificate: certData, serverHeaders },
        };
    } catch (err) {
        if (err.name === "AbortError") return { error: "CONNECTION_TIMEOUT" };
        return { error: `SSL inspection failed: ${err.message}` };
    }
}
