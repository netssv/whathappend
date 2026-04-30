/**
 * @module modules/background/handlers/perf.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: handleGetPerfTiming
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

// ===================================================================
// Get Performance Timing — reads window.performance from active tab
// ===================================================================

export async function handleGetPerfTiming() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return { error: "No active tab found." };
        if (!tab.url?.startsWith("http")) return { error: "Cannot access this page (non-HTTP)." };

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const nav = performance.getEntriesByType("navigation")[0] || {};
                const paint = performance.getEntriesByType("paint");
                const res = performance.getEntriesByType("resource");

                // Paint metrics
                const fp = paint.find(p => p.name === "first-paint");
                const fcp = paint.find(p => p.name === "first-contentful-paint");

                // LCP via PerformanceObserver (read cached entries)
                let lcp = 0;
                try {
                    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
                    if (lcpEntries.length > 0) lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
                } catch (_) {}

                // Resource summary
                let transferSize = 0, decodedSize = 0;
                for (const r of res) {
                    transferSize += r.transferSize || 0;
                    decodedSize += r.decodedBodySize || 0;
                }

                return {
                    url: location.href,
                    dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart) || 0,
                    tcp: Math.round(nav.connectEnd - nav.connectStart) || 0,
                    tls: nav.secureConnectionStart > 0
                        ? Math.round(nav.connectEnd - nav.secureConnectionStart)
                        : 0,
                    ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
                    download: Math.round(nav.responseEnd - nav.responseStart) || 0,
                    domInteractive: Math.round(nav.domInteractive - nav.startTime) || 0,
                    domComplete: Math.round(nav.domComplete - nav.startTime) || 0,
                    pageLoad: Math.round(nav.loadEventEnd - nav.startTime) || 0,
                    firstPaint: fp ? Math.round(fp.startTime) : 0,
                    fcp: fcp ? Math.round(fcp.startTime) : 0,
                    lcp: lcp,
                    resourceCount: res.length,
                    transferSize,
                    decodedSize,
                };
            },
        });

        if (results?.[0]?.result) {
            return { success: true, data: results[0].result };
        }
        return { error: "Could not read performance data." };
    } catch (err) {
        return { error: `Performance API access failed: ${err.message}` };
    }
}
