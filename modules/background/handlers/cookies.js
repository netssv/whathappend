/**
 * @module modules/background/handlers/cookies.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: handleGetCookies
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

/**
 * WhatHappened — Cookies Background Handler
 *
 * Uses the chrome.cookies API to retrieve all cookies associated with a domain.
 */

export async function handleGetCookies({ domain }) {
    if (!domain) return { error: "Domain is required for cookie extraction." };

    try {
        // Find cookies that match the root domain (including subdomains)
        const cookies = await chrome.cookies.getAll({ domain });
        
        return { success: true, data: cookies };
    } catch (err) {
        return { error: `Failed to access cookies: ${err.message}` };
    }
}
