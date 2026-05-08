/**
 * @module modules/background/handlers/jitter.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 * - Exports: handleJitter
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";

// ===================================================================
// Jitter Handler — Latency Jitter Measurement
//
// Makes N sequential HEAD requests to the target and returns
// individual timings for the command module to calculate avg + jitter.
// ===================================================================

const JITTER_TIMEOUT = 5000;
const JITTER_ROUNDS = 5;

export async function handleJitter({ domain, abortId }) {
    const signal = createAbort(abortId || `jitter-${getNextAbortSeq()}`, JITTER_TIMEOUT * JITTER_ROUNDS + 5000);

    try {
        const results = [];

        for (let i = 0; i < JITTER_ROUNDS; i++) {
            if (signal.aborted) return { error: "Command cancelled." };

            const start = performance.now();
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), JITTER_TIMEOUT);
            const onGlobalAbort = () => ctrl.abort();
            signal.addEventListener("abort", onGlobalAbort);

            try {
                await fetch(`https://${domain}/?_t=${Date.now()}`, {
                    method: "HEAD",
                    mode: "no-cors",
                    cache: "no-store",
                    redirect: "manual",
                    signal: ctrl.signal,
                });
                const elapsed = Math.max(1, Math.round(performance.now() - start));
                results.push({ seq: i + 1, time: elapsed, ok: true });
            } catch (err) {
                if (err.name === "AbortError" && signal.aborted) throw err;
                const elapsed = Math.round(performance.now() - start);
                results.push({ seq: i + 1, time: elapsed, ok: false, error: err.message || "Timeout" });
            } finally {
                clearTimeout(timer);
                signal.removeEventListener("abort", onGlobalAbort);
            }

            // Short pause between rounds (except last)
            if (i < JITTER_ROUNDS - 1) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        completeAbort(abortId);
        return { success: true, data: { domain, results } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `Jitter test failed: ${err.message}` };
    }
}
