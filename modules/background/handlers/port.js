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
    const probePromises = ports.map(async (port) => {
        if (signal.aborted) return null;
        const portNum = parseInt(port);
        const start = performance.now();
        // Individual 3-second timeout per port to avoid hanging on filtered ports
        const portSignal = AbortSignal.timeout(3000);
        
        try {
            const proto = (portNum === 443 || portNum === 8443) ? "https" : "http";
            await fetch(`${proto}://${target}:${portNum}`, {
                method: "HEAD",
                mode: "no-cors",
                signal: portSignal,
                cache: "no-store",
            });
            // If fetch completes, something is listening
            return { port: portNum, open: true, time: Math.round(performance.now() - start) };
        } catch (err) {
            const elapsed = performance.now() - start;
            // Timeout usually means filtered (firewall dropped the packet silently)
            // Fast rejection means connection refused (closed)
            return {
                port: portNum,
                open: err.name === "TimeoutError" || elapsed >= 3000,
                time: Math.round(elapsed),
                hint: (err.name === "TimeoutError" || elapsed >= 3000) ? "filtered/open" : "closed",
            };
        }
    });

    const resolved = await Promise.all(probePromises);
    const results = resolved.filter(Boolean).sort((a, b) => a.port - b.port);

    completeAbort(abortId);
    return { success: true, data: { target, results } };
}
