/**
 * @module modules/background/handlers/port.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 * - Exports: handlePortProbe
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";

// ===================================================================
// Port Probe Handler — Browser-based port detection via fetch
// ===================================================================

export async function handlePortProbe({ target, ports, abortId }) {
    const signal = createAbort(abortId || `port-${getNextAbortSeq()}`, 30000);
    const results = [];

    for (const port of ports) {
        if (signal.aborted) return { error: "Command cancelled." };
        const portNum = parseInt(port);
        const start = performance.now();
        try {
            const proto = (portNum === 443 || portNum === 8443) ? "https" : "http";
            await fetch(`${proto}://${target}:${portNum}`, {
                method: "HEAD",
                mode: "no-cors",
                signal,
                cache: "no-store",
            });
            // If fetch completes (even opaque), something is listening
            results.push({ port: portNum, open: true, time: Math.round(performance.now() - start) });
        } catch (err) {
            if (err.name === "AbortError") return { error: "Command cancelled." };
            const elapsed = performance.now() - start;
            // Fast rejection (<500ms) usually means connection refused (closed)
            // Slow timeout (>2000ms) could mean filtered or open
            results.push({
                port: portNum,
                open: elapsed > 2000,
                time: Math.round(elapsed),
                hint: elapsed > 2000 ? "filtered/open" : "closed",
            });
        }
    }

    completeAbort(abortId);
    return { success: true, data: { target, results } };
}
