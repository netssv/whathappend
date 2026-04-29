/**
 * WhatHappened — Ephemeral API Cache (LRU-style)
 * Uses chrome.storage.session to cache deterministic background network requests.
 * Prevents redundant external API hits during rapid triage.
 */

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Wraps a background handler with a session-based cache.
 * @param {string} command - The terminal command (e.g. "dns")
 * @param {object} payload - The arguments passed to the command
 * @param {function} handlerFn - The async function that performs the actual network request
 * @returns {Promise<any>}
 */
export async function withCache(command, payload, handlerFn) {
    // We stringify the payload to create a deterministic cache key.
    // Example: cache:dns:{"domain":"google.com","type":"A"}
    const payloadStr = JSON.stringify(payload || {});
    const cacheKey = `cache:${command}:${payloadStr}`;

    try {
        // 1. Check Session Storage
        const data = await chrome.storage.session.get(cacheKey);
        const cachedItem = data[cacheKey];

        const now = Date.now();
        if (cachedItem && (now - cachedItem.timestamp < CACHE_TTL_MS)) {
            // console.log(`[CACHE HIT] ${command}`, payload);
            return cachedItem.payload;
        }

        // 2. Cache Miss — Execute Handler
        // console.log(`[CACHE MISS] ${command}`, payload);
        const result = await handlerFn();

        // 3. Store result if successful
        // We only cache successful responses (no .error property)
        // This ensures temporary network blips (like DNS SERVFAIL) don't get stuck in cache.
        if (result && !result.error) {
            await chrome.storage.session.set({
                [cacheKey]: {
                    payload: result,
                    timestamp: now
                }
            });
        }

        return result;

    } catch (err) {
        // Fallback: If cache system completely fails (e.g. quota exceeded), just run the handler
        console.warn(`[CACHE WARNING] Session cache failed for ${command}:`, err);
        return await handlerFn();
    }
}
