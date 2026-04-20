import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { ensureProtocol } from "../../utils.js";
import { CONFIG } from "../../data/constants.js";

// ===================================================================
// HTTP Headers Handler — HEAD Request
// ===================================================================

export async function handleHTTPHeaders({ url, followRedirects, abortId }) {
    const signal = createAbort(abortId || `http-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        let targetUrl = ensureProtocol(url);

        const response = await fetch(targetUrl, {
            method: "HEAD",
            redirect: followRedirects ? "follow" : "manual",
            signal,
        });

        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

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
        return { error: `HTTP request failed: ${err.message}` };
    }
}

// ===================================================================
// Fetch Text Handler — GET request returning body
// ===================================================================

export async function handleFetchText({ url, abortId }) {
    const signal = createAbort(abortId || `text-${getNextAbortSeq()}`, CONFIG.TIMEOUT_SSL);
    try {
        let targetUrl = ensureProtocol(url);
        const response = await fetch(targetUrl, { redirect: "follow", signal });
        if (!response.ok) {
            return { error: `HTTP ${response.status}` };
        }
        const text = await response.text();
        completeAbort(abortId);
        return { success: true, data: { text: text.substring(0, 50000), status: response.status, url: response.url } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: err.message };
    }
}
