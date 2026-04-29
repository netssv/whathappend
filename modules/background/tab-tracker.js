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
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab?.url) {
            const domain = extractDomain(tab.url);
            return { domain: domain || "restricted" };
        }
        return { domain: "restricted" };
    } catch (_e) {
        return { domain: "restricted" };
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
