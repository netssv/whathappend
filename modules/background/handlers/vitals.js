/**
 * @module modules/background/handlers/vitals.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: handleGetWebVitals
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

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
                return new Promise((resolve) => {
                    let lcp = -1;
                    let cls = -1;
                    let inp = -1;

                    // Fallback: Check if they are already in the performance buffer
                    try {
                        const all = performance.getEntries();
                        for (const e of all) {
                            if (e.entryType === "largest-contentful-paint" && e.startTime > lcp) lcp = e.startTime;
                            if (e.entryType === "layout-shift" && !e.hadRecentInput) {
                                if (cls === -1) cls = 0;
                                cls += e.value;
                            }
                            if (e.entryType === "event" && e.duration > inp) inp = e.duration;
                        }
                    } catch (_) {}

                    try {
                        const lcpObs = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            if (entries.length > 0) lcp = entries[entries.length - 1].startTime;
                        });
                        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
                    } catch (_) {}

                    try {
                        let totalCls = cls === -1 ? 0 : cls;
                        const clsObs = new PerformanceObserver((list) => {
                            for (const e of list.getEntries()) {
                                if (!e.hadRecentInput) totalCls += e.value;
                            }
                            cls = totalCls;
                        });
                        clsObs.observe({ type: "layout-shift", buffered: true });
                    } catch (_) {}

                    try {
                        let maxInp = inp;
                        const inpObs = new PerformanceObserver((list) => {
                            for (const e of list.getEntries()) {
                                if (e.duration > maxInp) maxInp = e.duration;
                            }
                            inp = maxInp;
                        });
                        inpObs.observe({ type: "event", buffered: true });
                    } catch (_) {}

                    setTimeout(() => {
                        resolve({ lcp, cls, inp, url: location.href, debug: "promise_resolved" });
                    }, 250);
                });
            },
        });

        if (results?.[0]?.result) {
            const d = results[0].result;
            if (d.debugError) {
                return { error: `Script error: ${d.debugError}` };
            }
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
        return { error: `Could not read Core Web Vitals. Result: ${JSON.stringify(results)}` };
    } catch (err) {
        return { error: `Web Vitals access failed: ${err.message}` };
    }
}
