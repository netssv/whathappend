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

export async function handlePersistCookies({ domain }) {
    if (!domain) return { error: "Domain is required." };
    try {
        const cookies = await chrome.cookies.getAll({ domain });
        let count = 0;
        const oneYear = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 365);
        for (const c of cookies) {
            const url = (c.secure ? "https://" : "http://") + c.domain.replace(/^\./, "") + c.path;
            const newC = {
                url, name: c.name, value: c.value, domain: c.domain, path: c.path,
                secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
                expirationDate: oneYear, storeId: c.storeId
            };
            if (c.hostOnly) delete newC.domain;
            await chrome.cookies.set(newC);
            count++;
        }
        return { success: true, count };
    } catch (e) {
        return { error: e.message };
    }
}

export async function handleKeepAlive({ domain, stop }) {
    if (!domain) return { error: "Domain is required." };
    const alarmName = `keepalive-${domain}`;
    
    if (stop) {
        await chrome.alarms.clear(alarmName);
        return { success: true, stopped: true };
    }
    
    await chrome.alarms.create(alarmName, { periodInMinutes: 5 });
    // Execute immediately once
    fetch(`https://${domain}`, { method: "HEAD", cache: "no-cache" }).catch(()=>null);
    return { success: true, started: true };
}
