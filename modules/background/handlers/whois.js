import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// WHOIS Handler — RDAP Protocol
// ===================================================================

export async function handleWHOIS({ domain, abortId }) {
    const signal = createAbort(abortId || `whois-${getNextAbortSeq()}`, CONFIG.TIMEOUT_WHOIS);
    try {
        const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
        const response = await fetch(url, { signal });

        if (!response.ok) {
            return { error: `WHOIS lookup failed with HTTP ${response.status}` };
        }

        const data = await response.json();
        completeAbort(abortId);
        return { success: true, data };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `WHOIS lookup failed: ${err.message}` };
    }
}
