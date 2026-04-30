/**
 * @module modules/background/handlers/isup.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 * - Exports: handleIsUpLocal, handleIsUpGlobal
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";

// ===================================================================
// IsUp Handler — Local HTTP reachability check
//
// Makes a HEAD request to the target with a short timeout.
// Returns: { reachable: bool, status: number|null, timeMs: number }
// ===================================================================

const ISUP_TIMEOUT = 6000;

export async function handleIsUpLocal({ domain, abortId }) {
    const signal = createAbort(abortId || `isup-${getNextAbortSeq()}`, ISUP_TIMEOUT + 2000);
    const start = performance.now();

    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ISUP_TIMEOUT);
        const onGlobalAbort = () => ctrl.abort();
        signal.addEventListener("abort", onGlobalAbort);

        let status = null;
        let reachable = false;

        try {
            const resp = await fetch(`https://${domain}`, {
                method: "HEAD",
                mode: "no-cors",
                cache: "no-store",
                redirect: "manual",
                signal: ctrl.signal,
            });
            // mode: no-cors returns opaque response (status 0) but that means reachable
            status = resp.status || 0;
            reachable = true;
        } catch (httpsErr) {
            if (httpsErr.name === "AbortError" && signal.aborted) throw httpsErr;
            // Try HTTP fallback
            try {
                const resp = await fetch(`http://${domain}`, {
                    method: "HEAD",
                    mode: "no-cors",
                    cache: "no-store",
                    redirect: "manual",
                    signal: ctrl.signal,
                });
                status = resp.status || 0;
                reachable = true;
            } catch (httpErr) {
                if (httpErr.name === "AbortError" && signal.aborted) throw httpErr;
                reachable = false;
            }
        } finally {
            clearTimeout(timer);
            signal.removeEventListener("abort", onGlobalAbort);
        }

        completeAbort(abortId);
        return {
            success: true,
            data: {
                reachable,
                status,
                timeMs: Math.round(performance.now() - start),
            },
        };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `Local check failed: ${err.message}` };
    }
}

// ===================================================================
// IsUp Global — Queries Google DNS-over-HTTPS for global reachability
// ===================================================================

export async function handleIsUpGlobal({ domain }) {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);

        let isDown = null;
        let responseCode = null;

        // 1) Primary Check: Try an HTTP-based reachability check via Hackertarget
        try {
            const httpCheck = await fetch(`https://api.hackertarget.com/httpheaders/?q=${domain}`, {
                signal: ctrl.signal
            });
            if (httpCheck.ok) {
                const text = await httpCheck.text();
                if (text.includes("error connecting to target") || text.includes("Name or service not known") || text.includes("Connection timed out")) {
                    isDown = true;
                    responseCode = "OFFLINE";
                } else if (text.includes("error check your api query") || text.includes("error")) {
                    // Invalid domain format, we let it fallback to DNS which might NXDOMAIN
                } else if (text.startsWith("HTTP/")) {
                    isDown = false;
                    responseCode = "ONLINE";
                }
                // If it includes "API count exceeded", we leave isDown as null to trigger fallback
            }
        } catch (e) {
            // Ignore HTTP proxy errors and fall back to DNS
        }

        // 2) Fallback to Google DNS as a proxy for "is this globally routed?" if HTTP proxy fails
        if (isDown === null) {
            const resp = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
                signal: ctrl.signal,
                headers: { "Accept": "application/json" },
            });

            if (!resp.ok) {
                clearTimeout(timer);
                return { success: false, error: `DNS API returned ${resp.status}` };
            }

            const data = await resp.json();

            // Status 0 is NOERROR. Status 3 is NXDOMAIN (doesn't exist).
            // If we get an Answer array, it resolves globally.
            isDown = data.Status !== 0 || !data.Answer;
            responseCode = data.Status === 3 ? "NXDOMAIN" : null;
        }

        clearTimeout(timer);

        return {
            success: true,
            data: {
                isDown: isDown,
                host: domain,
                responseCode: responseCode,
            },
        };
    } catch (err) {
        return { success: false, error: err.message || "Global check failed" };
    }
}
