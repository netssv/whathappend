import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// DNS Handler — Google DNS-over-HTTPS
//
// Includes automatic retry on SERVFAIL (status 2) with a 500ms delay.
// ===================================================================

// DNS response status codes per RFC 6895
const DNS_STATUS = { 0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 5: "REFUSED" };

/**
 * Execute a DNS-over-HTTPS query.
 * @param {Object} params - { domain, type, abortId }
 * @returns {Object} { success, data } or { error }
 */
export async function handleDNS({ domain, type, abortId }) {
    const result = await dnsQuery(domain, type, abortId);

    const isServFail = result.data?.Status === 2;
    const isEmpty = result.success && (!result.data?.Answer || result.data.Answer.length === 0);

    if (isServFail || isEmpty) {
        await delay(400);
        const retry = await dnsQuery(domain, type, abortId);
        
        if (retry.data?.Status === 2) {
            return {
                error: "DNS Resolver failure. Authority servers are not responding.",
                data: retry.data,
                retried: true,
            };
        }
        return retry;
    }

    return result;
}

// ---------------------------------------------------------------------------
// Core query — single attempt
// ---------------------------------------------------------------------------

async function dnsQuery(domain, type, abortId) {
    const signal = createAbort(abortId || `dns-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) return { error: `DNS query failed with HTTP ${response.status}` };

        const data = await response.json();
        completeAbort(abortId);
        return { success: true, data };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `DNS lookup failed: ${err.message}` };
    }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
