/**
 * @module modules/background/handlers/whois.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 *     - CONFIG from '../../data/constants.js'
 *     - parseWhoisSummary from '../../commands/web/whois-parser.js'
 * - Exports: handleWHOIS, handleIPWhois
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";
import { parseWhoisSummary } from "../../commands/web/whois-parser.js";

// ===================================================================
// WHOIS Handler — RDAP Protocol (Domains & IPs)
//
// Network layer only. All parsing delegated to whois-parser.js.
// Returns pre-parsed { registrar, expiry } alongside raw data.
// ===================================================================

// ---------------------------------------------------------------------------
// Domain WHOIS
// ---------------------------------------------------------------------------

export async function handleWHOIS({ domain, abortId }) {
    const signal = createAbort(abortId || `whois-${getNextAbortSeq()}`, CONFIG.TIMEOUT_WHOIS);
    try {
        const url = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) return { error: `WHOIS lookup failed with HTTP ${response.status}` };

        const data = await response.json();
        completeAbort(abortId);

        // Delegate parsing to the shared heuristic engine
        const { registrar, expiry } = parseWhoisSummary(data);
        return { success: true, data, registrar, expiry };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `WHOIS lookup failed: ${err.message}` };
    }
}

// ---------------------------------------------------------------------------
// IP WHOIS
// ---------------------------------------------------------------------------

export async function handleIPWhois({ ip, abortId }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_WHOIS);
    try {
        const url = `https://rdap.org/ip/${encodeURIComponent(ip)}`;
        const response = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!response.ok) return { error: `IP RDAP failed: HTTP ${response.status}` };

        const data = await response.json();
        const org = extractOrgName(data.entities) || data.name || null;
        return { success: true, org };
    } catch (err) {
        clearTimeout(timer);
        return { error: err.message };
    }
}

// ---------------------------------------------------------------------------
// IP Org Extraction (simple — no heuristic needed)
// ---------------------------------------------------------------------------

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
