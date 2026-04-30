/**
 * @module modules/background/tab-tracker.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - extractDomain from '../utils.js'
 * - Exports: getActiveDomain, setupTabTracker
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

// ===================================================================
// Active Tab Tracking — Context Awareness
// ===================================================================

import { extractDomain } from "../utils.js";

async function broadcastDomain(urlString) {
    const domain = extractDomain(urlString);

    try {
        await chrome.runtime.sendMessage({
            type: "domain-changed",
            domain: domain || "restricted",
        });
    } catch (_e) {
        // Side panel may not be open; silently ignore
    }
}

export async function getActiveDomain() {
    try {
        const tabs = await chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
        });
        if (tabs && tabs.length > 0 && tabs[0].url) {
            const domain = extractDomain(tabs[0].url);
            return { domain: domain || "restricted" };
        }
        return { domain: "restricted" };
    } catch (_e) {
        return { domain: "restricted" };
    }
}

export async function checkTabExists(domain) {
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url && extractDomain(tab.url) === domain) {
                return { exists: true, windowId: tab.windowId, tabId: tab.id };
            }
        }
        return { exists: false };
    } catch (_e) {
        return { exists: false };
    }
}

export function setupTabTracker() {
    // When the user switches to a different tab
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab?.url) {
                broadcastDomain(tab.url);
            }
        } catch (_e) {
            // Tab may have been closed between event and get; ignore
        }
    });

    // When the active tab navigates to a new URL
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url && tab.active) {
            broadcastDomain(changeInfo.url);
        }
    });
}
