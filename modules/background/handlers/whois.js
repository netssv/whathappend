import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// WHOIS Handler — RDAP Protocol (Domains & IPs)
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

export async function handleIPWhois({ ip, abortId }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
        const url = `https://rdap.org/ip/${encodeURIComponent(ip)}`;
        const response = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);

        if (!response.ok) return { error: `IP RDAP failed: HTTP ${response.status}` };

        const data = await response.json();
        // Extract org name from RDAP response
        const name = data.name || null;
        const org = extractOrgName(data.entities) || name;
        return { success: true, org: org || null };
    } catch (err) {
        clearTimeout(timer);
        return { error: err.message };
    }
}

function extractOrgName(entities) {
    if (!entities?.length) return null;
    for (const e of entities) {
        if (e.vcardArray?.[1]) {
            for (const p of e.vcardArray[1]) {
                if (p[0] === "org" && p[3]) return p[3];
                if (p[0] === "fn" && p[3]) return p[3];
            }
        }
        if (e.entities?.length) {
            const found = extractOrgName(e.entities);
            if (found) return found;
        }
    }
    return null;
}
