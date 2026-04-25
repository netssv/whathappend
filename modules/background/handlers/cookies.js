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
