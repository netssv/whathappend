// ===================================================================
// Web Vitals Handler — Extracts CWV from the active tab
// ===================================================================

export async function handleGetWebVitals() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return { error: "No active tab found." };
        if (!tab.url?.startsWith("http")) return { error: "Cannot access this page (non-HTTP)." };

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // LCP
                let lcp = -1;
                try {
                    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
                    if (lcpEntries.length > 0) lcp = lcpEntries[lcpEntries.length - 1].startTime;
                } catch (_) {}

                // CLS (sum of all layout-shift entries without recent input)
                let cls = -1;
                try {
                    const lsEntries = performance.getEntriesByType("layout-shift");
                    if (lsEntries.length > 0) {
                        cls = lsEntries
                            .filter(e => !e.hadRecentInput)
                            .reduce((sum, e) => sum + e.value, 0);
                    }
                } catch (_) {}

                // INP (worst interaction-to-next-paint from event timing)
                let inp = -1;
                try {
                    const events = performance.getEntriesByType("event");
                    if (events.length > 0) {
                        inp = Math.max(...events.map(e => e.duration));
                    }
                } catch (_) {}

                return { lcp, cls, inp, url: location.href };
            },
        });

        if (results?.[0]?.result) {
            const d = results[0].result;
            return {
                success: true,
                data: {
                    lcp: d.lcp >= 0 ? d.lcp : null,
                    cls: d.cls >= 0 ? d.cls : null,
                    inp: d.inp >= 0 ? d.inp : null,
                    url: d.url,
                },
            };
        }
        return { error: "Could not read Core Web Vitals." };
    } catch (err) {
        return { error: `Web Vitals access failed: ${err.message}` };
    }
}
