import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs — Manage open browser tabs
//
//  Subcommands:
//    tabs / tabs list  — Show all open tabs with status indicators
//    tabs close <ID>   — Close a specific tab by its ID
//    tabs info <ID>    — Show tab details + JS heap memory snapshot
// ===================================================================

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "N/A";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(1)} ${units[i]}`;
}

function statusBadge(tab) {
    if (tab.discarded) return `${ANSI.yellow}💤 Discarded${ANSI.reset}`;
    if (tab.status === "loading") return `${ANSI.cyan}⏳ Loading${ANSI.reset}`;
    if (tab.audible) return `${ANSI.green}🔊 Audio${ANSI.reset}`;
    if (tab.active) return `${ANSI.green}● Active${ANSI.reset}`;
    return `${ANSI.dim}○ Idle${ANSI.reset}`;
}

export async function cmdTabs(args) {
    const sub = args[0]?.toLowerCase();

    // ── LIST ─────────────────────────────────────────────────────
    if (!sub || sub === "list") {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve(`${ANSI.red}[ERROR] Could not retrieve tabs.${ANSI.reset}`);
                    return;
                }

                // Group tabs by hostname
                const groups = new Map();
                for (const tab of tabs) {
                    let host = "";
                    try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "chrome://internal"; }
                    if (!groups.has(host)) groups.set(host, []);
                    groups.get(host).push(tab);
                }

                let o = `\n${ANSI.cyan}${ANSI.bold}  Open Tabs ${ANSI.reset}${ANSI.dim}(${tabs.length} tabs, ${groups.size} sites)${ANSI.reset}\n`;
                const maxTitle = 32;

                for (const [host, hostTabs] of groups) {
                    o += `\n  ${ANSI.cyan}${host}${ANSI.reset}\n`;

                    for (const tab of hostTabs) {
                        const icon = tab.active ? `${ANSI.green}●${ANSI.reset}` :
                                     tab.discarded ? `${ANSI.yellow}💤${ANSI.reset}` :
                                     tab.audible ? `${ANSI.green}🔊${ANSI.reset}` :
                                     tab.status === "loading" ? `${ANSI.cyan}⏳${ANSI.reset}` :
                                     `${ANSI.dim}○${ANSI.reset}`;

                        let title = tab.title || "Untitled";
                        if (title.length > maxTitle) title = title.substring(0, maxTitle - 1) + "…";

                        const idStr = `${ANSI.dim}#${tab.id}${ANSI.reset}`;
                        o += `    ${icon} ${ANSI.white}${title}${ANSI.reset}  ${idStr}\n`;
                    }
                }

                o += `\n${ANSI.dim}  ● active  ○ idle  💤 discarded  🔊 audio  ⏳ loading${ANSI.reset}`;
                o += `\n${ANSI.dim}  ${ANSI.white}tabs close <ID>${ANSI.dim} │ ${ANSI.white}tabs info <ID>${ANSI.reset}\n`;
                resolve(o);
            });
        });
    }

    // ── CLOSE ────────────────────────────────────────────────────
    if (sub === "close") {
        if (args.length < 2) {
            return `${ANSI.red}[ERROR] Missing Tab ID. Usage: tabs close <ID>${ANSI.reset}`;
        }
        const tabId = parseInt(args[1], 10);
        if (isNaN(tabId)) {
            return `${ANSI.red}[ERROR] Invalid Tab ID: ${args[1]}${ANSI.reset}`;
        }

        return new Promise((resolve) => {
            chrome.tabs.remove(tabId, () => {
                if (chrome.runtime.lastError) {
                    resolve(`${ANSI.red}[ERROR] ${chrome.runtime.lastError.message}${ANSI.reset}`);
                } else {
                    resolve(`${ANSI.green}[OK] Tab ${tabId} closed.${ANSI.reset}`);
                }
            });
        });
    }

    // ── INFO (JS Heap Memory Snapshot) ───────────────────────────
    if (sub === "info") {
        if (args.length < 2) {
            return `${ANSI.red}[ERROR] Missing Tab ID. Usage: tabs info <ID>${ANSI.reset}`;
        }
        const tabId = parseInt(args[1], 10);
        if (isNaN(tabId)) {
            return `${ANSI.red}[ERROR] Invalid Tab ID: ${args[1]}${ANSI.reset}`;
        }

        try {
            const tab = await chrome.tabs.get(tabId);
            let o = `\n${ANSI.cyan}${ANSI.bold}  Tab Report [ID: ${tabId}]${ANSI.reset}\n`;
            o += `  ${ANSI.dim}${"━".repeat(38)}${ANSI.reset}\n`;
            o += `  ${ANSI.white}Title${ANSI.reset}      ${tab.title || "N/A"}\n`;
            o += `  ${ANSI.white}URL${ANSI.reset}        ${tab.url || "N/A"}\n`;
            o += `  ${ANSI.white}Status${ANSI.reset}     ${statusBadge(tab)}\n`;
            o += `  ${ANSI.white}Pinned${ANSI.reset}     ${tab.pinned ? "Yes" : "No"}\n`;
            o += `  ${ANSI.white}Muted${ANSI.reset}      ${tab.mutedInfo?.muted ? "Yes" : "No"}\n`;
            o += `  ${ANSI.white}Incognito${ANSI.reset}  ${tab.incognito ? "Yes" : "No"}\n`;

            // Inject script to read JS heap (static snapshot)
            if (tab.url && tab.url.startsWith("http")) {
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId },
                        func: () => {
                            const mem = performance.memory || {};
                            const entries = performance.getEntriesByType("resource");
                            return {
                                usedHeap: mem.usedJSHeapSize || 0,
                                totalHeap: mem.totalJSHeapSize || 0,
                                heapLimit: mem.jsHeapSizeLimit || 0,
                                resourceCount: entries.length,
                            };
                        },
                    });

                    const data = results?.[0]?.result;
                    if (data && data.heapLimit > 0) {
                        const pct = ((data.usedHeap / data.heapLimit) * 100).toFixed(1);
                        const bar = pct > 75 ? ANSI.red : pct > 50 ? ANSI.yellow : ANSI.green;

                        o += `\n  ${ANSI.cyan}${ANSI.bold}  JS Heap Memory (Snapshot)${ANSI.reset}\n`;
                        o += `  ${ANSI.dim}${"━".repeat(38)}${ANSI.reset}\n`;
                        o += `  ${ANSI.white}Used${ANSI.reset}       ${formatBytes(data.usedHeap)}\n`;
                        o += `  ${ANSI.white}Allocated${ANSI.reset}  ${formatBytes(data.totalHeap)}\n`;
                        o += `  ${ANSI.white}Limit${ANSI.reset}      ${formatBytes(data.heapLimit)}\n`;
                        o += `  ${ANSI.white}Usage${ANSI.reset}      ${bar}${pct}%${ANSI.reset}\n`;
                        o += `  ${ANSI.white}Resources${ANSI.reset}  ${data.resourceCount} loaded\n`;
                    } else {
                        o += `\n  ${ANSI.dim}[INFO] JS heap data not available for this page.${ANSI.reset}\n`;
                    }
                } catch {
                    o += `\n  ${ANSI.dim}[INFO] Cannot inject into this tab (restricted page).${ANSI.reset}\n`;
                }
            } else {
                o += `\n  ${ANSI.dim}[INFO] Memory profiling requires an HTTP/HTTPS page.${ANSI.reset}\n`;
            }

            o += `\n  ${ANSI.dim}[NOTE] CPU usage is not available to Chrome extensions.${ANSI.reset}`;
            o += `\n  ${ANSI.dim}       Use chrome://discards for full process telemetry.${ANSI.reset}\n`;
            return o;
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message || "Tab not found."}${ANSI.reset}`;
        }
    }

    return `${ANSI.red}[ERROR] Unknown: '${sub}'. Try: ${ANSI.white}tabs${ANSI.dim}, ${ANSI.white}tabs close <ID>${ANSI.dim}, ${ANSI.white}tabs info <ID>${ANSI.reset}`;
}
