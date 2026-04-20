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
