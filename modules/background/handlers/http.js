import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { ensureProtocol } from "../../utils.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// HTTP Handlers — HEAD & GET with Intuitive Error Classification
//
// Replaces generic "Failed to fetch" with diagnostic error codes.
// Uses A-record pre-check to distinguish dead server vs. missing domain.
// ===================================================================

// Error pattern → intuitive classification
const ERROR_MAP = [
    { pattern: /ERR_NAME_NOT_RESOLVED/i,     code: "DNS_ERROR",   message: "Domain does not exist or has no A records." },
    { pattern: /ERR_CONNECTION_TIMED_OUT/i,   code: "TIMEOUT",     message: "Connection took too long. Possible firewall block or severe server lag." },
    { pattern: /ERR_CONNECTION_REFUSED/i,     code: "REFUSED",     message: "Server actively refused the connection. Service may be stopped." },
    { pattern: /ERR_CONNECTION_RESET/i,       code: "RESET",       message: "Connection was reset by the server. Possible firewall drop." },
    { pattern: /ERR_SSL_PROTOCOL_ERROR/i,     code: "SSL_ERROR",   message: "SSL handshake failed. Certificate or protocol mismatch." },
    { pattern: /ERR_CERT/i,                   code: "SSL_CERT",    message: "SSL certificate error. May be expired, self-signed, or mismatched." },
    { pattern: /Failed to fetch/i,            code: "OFFLINE",     message: "Server is not responding to HTTPS requests. Host might be down." },
];

// ---------------------------------------------------------------------------
// HTTP Headers — HEAD Request
// ---------------------------------------------------------------------------

export async function handleHTTPHeaders({ url, followRedirects, abortId }) {
    const signal = createAbort(abortId || `http-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        const targetUrl = ensureProtocol(url);
        const response = await fetch(targetUrl, {
            method: "HEAD",
            redirect: followRedirects ? "follow" : "manual",
            signal,
        });

        const headers = {};
        response.headers.forEach((value, key) => { headers[key] = value; });

        completeAbort(abortId);
        return {
            success: true,
            data: {
                status: response.status,
                statusText: response.statusText,
                url: response.url || targetUrl,
                headers,
            },
        };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return classifyFetchError(err, url);
    }
}

// ---------------------------------------------------------------------------
// Fetch Text — GET Request returning body
// ---------------------------------------------------------------------------

export async function handleFetchText({ url, abortId }) {
    const signal = createAbort(abortId || `text-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        const targetUrl = ensureProtocol(url);
        const response = await fetch(targetUrl, { redirect: "follow", signal });
        if (!response.ok) return { error: `HTTP ${response.status}` };

        const text = await response.text();
        completeAbort(abortId);
        return { success: true, data: { text: text.substring(0, 50000), status: response.status, url: response.url } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return classifyFetchError(err, url);
    }
}

// ---------------------------------------------------------------------------
// Error Classification Engine
// ---------------------------------------------------------------------------

/**
 * Classify a fetch error into an intuitive diagnostic message.
 * Uses pattern matching first, then falls back to an A-record pre-check
 * to distinguish "missing domain" from "dead server".
 *
 * @param {Error} err - The caught fetch error
 * @param {string} url - The original URL/domain
 * @returns {Object} { error, code }
 */
export async function classifyFetchError(err, url) {
    const msg = err.message || "";

    // Match against known error patterns
    for (const entry of ERROR_MAP) {
        if (entry.pattern.test(msg)) {
            return { error: `[${entry.code}] ${entry.message}`, code: entry.code };
        }
    }

    // Generic "Failed to fetch" — run A-record check to disambiguate
    if (/failed to fetch/i.test(msg)) {
        const hasA = await checkARecord(url);
        if (!hasA) {
            return { error: "[DNS_ERROR] Domain does not exist or has no A records.", code: "DNS_ERROR" };
        }
        return { error: "[OFFLINE] Server is not responding to HTTPS requests. Host might be down.", code: "OFFLINE" };
    }

    // Fallback: return the raw error with a generic code
    return { error: `[NET_ERROR] HTTP request failed: ${msg}`, code: "NET_ERROR" };
}

/**
 * Quick A-record existence check via Google DoH.
 * Returns true if at least one A record exists.
 */
async function checkARecord(url) {
    try {
        const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const resp = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
            { signal: ctrl.signal }
        );
        clearTimeout(timer);
        const data = await resp.json();
        return data.Answer?.length > 0;
    } catch (_) {
        return false; // If DNS check itself fails, assume no records
    }
}
