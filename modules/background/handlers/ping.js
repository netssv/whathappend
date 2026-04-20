import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// Ping Handler — HTTP HEAD Latency Test
// ===================================================================

export async function handlePing({ domain, abortId }) {
    const signal = createAbort(abortId || `ping-${getNextAbortSeq()}`, CONFIG.TIMEOUT_PING);
    try {
        async function fetchWithTimeout(url, timeoutMs) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            const onGlobalAbort = () => ctrl.abort();
            signal.addEventListener("abort", onGlobalAbort);
            try {
                await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store", redirect: "manual", signal: ctrl.signal });
            } finally {
                clearTimeout(timer);
                signal.removeEventListener("abort", onGlobalAbort);
            }
        }

        async function probeSinglePing(domain, seq) {
            const start = performance.now();
            try {
                await fetchWithTimeout(`https://${domain}`, CONFIG.TIMEOUT_HTTP);
                return { seq, alive: true, time: Math.max(1, Math.round(performance.now() - start)) };
            } catch (httpsErr) {
                if (httpsErr.name === "AbortError" && signal.aborted) throw httpsErr;
            }

            try {
                await fetchWithTimeout(`http://${domain}`, CONFIG.TIMEOUT_HTTP);
                return { seq, alive: true, time: Math.max(1, Math.round(performance.now() - start)) };
            } catch (err) {
                if (err.name === "AbortError" && signal.aborted) throw err;
                return { seq, alive: false, time: Math.round(performance.now() - start), error: err.message || "Timeout" };
            }
        }

        const results = [];
        for (let i = 0; i < 4; i++) {
            if (signal.aborted) return { error: "Command cancelled." };
            const res = await probeSinglePing(domain, i + 1);
            results.push(res);
            if (i < 3) await new Promise(r => setTimeout(r, 1000));
        }
        completeAbort(abortId);
        return { success: true, data: { domain, results } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `Ping failed: ${err.message}` };
    }
}
