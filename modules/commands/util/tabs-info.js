import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs-info — Detailed tab report + JS heap memory snapshot
// ===================================================================

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "N/A";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(1)} ${u[i]}`;
}

function icon(tab) {
    if (tab.active) return `${ANSI.green}●${ANSI.reset}`;
    if (tab.audible) return `${ANSI.green}♪${ANSI.reset}`;
    if (tab.status === "loading") return `${ANSI.cyan}◌${ANSI.reset}`;
    if (tab.discarded) return `${ANSI.yellow}z${ANSI.reset}`;
    return `${ANSI.dim}Z${ANSI.reset}`;
}

export async function tabInfo(tabId, label) {
    try {
        const tab = await chrome.tabs.get(tabId);
        const sep = `${ANSI.dim}${"━".repeat(34)}${ANSI.reset}`;
        let o = `\n${ANSI.cyan}${ANSI.bold}  Tab #${label}${ANSI.reset}\n  ${sep}\n`;
        o += `  ${ANSI.white}Title${ANSI.reset}     ${tab.title || "N/A"}\n`;
        o += `  ${ANSI.white}URL${ANSI.reset}       ${tab.url || "N/A"}\n`;
        o += `  ${ANSI.white}Status${ANSI.reset}    ${icon(tab)} ${tab.status}\n`;
        o += `  ${ANSI.white}Pinned${ANSI.reset}    ${tab.pinned ? "Yes" : "No"}\n`;

        if (tab.url?.startsWith("http")) {
            try {
                const r = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        const m = performance.memory || {};
                        return {
                            used: m.usedJSHeapSize || 0,
                            total: m.totalJSHeapSize || 0,
                            limit: m.jsHeapSizeLimit || 0,
                            res: performance.getEntriesByType("resource").length,
                        };
                    },
                });
                const d = r?.[0]?.result;
                if (d?.limit > 0) {
                    const pct = ((d.used / d.limit) * 100).toFixed(1);
                    const c = pct > 75 ? ANSI.red : pct > 50 ? ANSI.yellow : ANSI.green;
                    o += `\n  ${ANSI.cyan}JS Heap${ANSI.reset}\n  ${sep}\n`;
                    o += `  ${ANSI.white}Used${ANSI.reset}      ${formatBytes(d.used)}\n`;
                    o += `  ${ANSI.white}Alloc${ANSI.reset}     ${formatBytes(d.total)}\n`;
                    o += `  ${ANSI.white}Limit${ANSI.reset}     ${formatBytes(d.limit)}\n`;
                    o += `  ${ANSI.white}Usage${ANSI.reset}     ${c}${pct}%${ANSI.reset}\n`;
                    o += `  ${ANSI.white}Assets${ANSI.reset}    ${d.res} loaded\n`;
                }
            } catch {
                o += `\n  ${ANSI.dim}Cannot read memory (restricted).${ANSI.reset}\n`;
            }
        }
        o += `\n  ${ANSI.dim}CPU not available to extensions.${ANSI.reset}\n`;
        return o;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
