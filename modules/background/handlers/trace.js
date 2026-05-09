/**
 * @module modules/background/handlers/trace.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - createAbort, completeAbort, getNextAbortSeq from '../abort.js'
 *     - ensureProtocol from '../../utils.js'
 *     - classifyFetchError from './http.js'
 * - Exports: handleRedirectTrace
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { createAbort, completeAbort, getNextAbortSeq } from "../abort.js";
import { ensureProtocol } from "../../utils.js";
import { classifyFetchError } from "./http.js";

// ===================================================================
// Redirect Trace Handler — Follow HTTP Redirect Chain
// ===================================================================

export async function handleRedirectTrace({ url, abortId }) {
    const signal = createAbort(abortId || `trace-${getNextAbortSeq()}`, 15000);
    try {
        const hops = [];
        let currentUrl = ensureProtocol(url);

        let maxRedirects = 10;
        while (maxRedirects-- > 0) {
            if (signal.aborted) return { error: "Command cancelled." };
            try {
                const resp = await fetch(currentUrl, { method: "HEAD", redirect: "manual", signal });
                
                if (resp.type === "opaqueredirect" || resp.status === 0) {
                    // MV3 Fetch API hides cross-origin redirect locations (opaqueredirect).
                    // Fallback: follow the redirect to get the final destination.
                    const followResp = await fetch(currentUrl, { method: "HEAD", redirect: "follow", signal });
                    hops.push({
                        url: currentUrl,
                        status: "REDIRECT",
                        statusText: "Cross-Origin (Opaque)",
                        location: followResp.url,
                    });
                    
                    if (followResp.url && followResp.url !== currentUrl) {
                        const headers = {};
                        followResp.headers.forEach((v, k) => {
                            if (["server", "content-type", "cache-control", "strict-transport-security", "x-powered-by"].includes(k.toLowerCase())) headers[k] = v;
                        });
                        hops.push({
                            url: followResp.url,
                            status: followResp.status,
                            statusText: followResp.statusText,
                            location: null,
                            headers: Object.keys(headers).length > 0 ? headers : null
                        });
                    }
                    break;
                }

                const location = resp.headers.get("location");
                let nextLocation = location;
                let isMeta = false;

                if (resp.status >= 300 && resp.status < 400 && location) {
                    // HTTP Redirect - will handle URL update after push
                } else if (resp.status === 200 && (resp.headers.get("content-type") || "").includes("text/html")) {
                    // Check for HTML Meta Refresh
                    const getResp = await fetch(currentUrl, { method: "GET", redirect: "manual", signal });
                    const text = await getResp.text();
                    const metaTags = text.match(/<meta[^>]+>/ig) || [];
                    for (const tag of metaTags) {
                        if (/http-equiv=["']?refresh["']?/i.test(tag)) {
                            const contentMatch = tag.match(/content=["']?\d+;\s*url=([^"'>\s]+)/i);
                            if (contentMatch) {
                                let rawUrl = contentMatch[1].replace(/&amp;/g, '&');
                                if (rawUrl.startsWith("'") || rawUrl.startsWith('"')) rawUrl = rawUrl.substring(1);
                                if (rawUrl.endsWith("'") || rawUrl.endsWith('"')) rawUrl = rawUrl.substring(0, rawUrl.length - 1);
                                nextLocation = rawUrl;
                                isMeta = true;
                                break;
                            }
                        }
                    }
                }

                const headers = {};
                if (!location && !isMeta) {
                    resp.headers.forEach((v, k) => {
                        if (["server", "content-type", "cache-control", "strict-transport-security", "x-powered-by"].includes(k.toLowerCase())) headers[k] = v;
                    });
                }

                hops.push({
                    url: currentUrl,
                    status: isMeta ? "META" : resp.status,
                    statusText: resp.statusText,
                    location: nextLocation,
                    headers: Object.keys(headers).length > 0 ? headers : null
                });

                if ((resp.status >= 300 && resp.status < 400 && location) || (isMeta && nextLocation)) {
                    currentUrl = new URL(nextLocation, currentUrl).href;
                } else {
                    break;
                }
            } catch (err) {
                if (err.name === "AbortError") return { error: "Command cancelled." };
                const classified = await classifyFetchError(err, currentUrl);
                hops.push({ url: currentUrl, error: classified.error });
                break;
            }
        }

        completeAbort(abortId);
        return { success: true, data: { hops } };
    } catch (err) {
        if (err.name === "AbortError") return { error: "Command cancelled." };
        return { error: `Redirect trace failed: ${err.message}` };
    }
}
