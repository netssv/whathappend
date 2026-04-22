// ===================================================================
// Get Page HTML — Live DOM from active tab via chrome.scripting
// ===================================================================

export async function handleGetPageHTML() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return { error: "No active tab found." };
        if (!tab.url?.startsWith("http")) return { error: "Cannot access this page (non-HTTP)." };

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.documentElement.outerHTML,
        });

        if (results?.[0]?.result) {
            return { success: true, data: { html: results[0].result, url: tab.url } };
        }
        return { error: "Could not read page content." };
    } catch (err) {
        return { error: `DOM access failed: ${err.message}` };
    }
}

// ===================================================================
// Detect Live Pixels — Inject script into MAIN world to check globals
// ===================================================================

export async function handleDetectLivePixels() {
    try {
        const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!t?.id) return { error: "No active tab found." };
        if (!t.url?.startsWith("http")) return { error: "Cannot access this page." };

        const res = await chrome.scripting.executeScript({
            target: { tabId: t.id },
            world: "MAIN",
            func: () => {
                const f = [];
                if (typeof window.fbq !== "undefined") f.push("facebook-pixel");
                if (typeof window.gtag !== "undefined") f.push("google-analytics");
                if (typeof window.dataLayer !== "undefined") f.push("google-gtm");
                if (typeof window.ttq !== "undefined") f.push("tiktok-pixel");
                return f;
            },
        });
        return { success: true, data: res?.[0]?.result || [] };
    } catch (err) {
        return { error: `Injection failed: ${err.message}` };
    }
}
