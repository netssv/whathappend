/**
 * @module modules/background/handlers/ip.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: handleGetPublicIP
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

// ===================================================================
// IP Handler — Get user's public IP via ipify.org
// ===================================================================

export async function handleGetPublicIP() {
    try {
        const resp = await fetch("https://api.ipify.org?format=json", {
            signal: AbortSignal.timeout(4000),
        });
        if (!resp.ok) return { error: `ipify HTTP ${resp.status}` };
        const data = await resp.json();
        return { success: true, data: { ip: data.ip } };
    } catch (err) {
        if (err.name === "TimeoutError") return { error: "Public IP lookup timed out." };
        return { error: `Public IP lookup failed: ${err.message}` };
    }
}
