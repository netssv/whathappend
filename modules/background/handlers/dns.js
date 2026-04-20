import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// DNS Handler — Google DNS-over-HTTPS
// ===================================================================

export async function handleDNS({ domain, type, abortId }) {
    const signal = createAbort(abortId || `dns-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) {
            return { error: `DNS query failed with HTTP ${response.status}` };
        }
        const data = await response.json();
        completeAbort(abortId);
        return { success: true, data };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `DNS lookup failed: ${err.message}` };
    }
}
