import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs — Manage open browser tabs
//
//  Subcommands:
//    tabs / tabs list  — Compact grouped listing
//    tabs close <#>    — Close a tab by its short index
//    tabs info <#>     — Tab details + JS heap memory snapshot
// ===================================================================

let _indexMap = [];  // Maps short index → real chrome tab ID

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "N/A";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(1)} ${u[i]}`;
}

function icon(tab) {
    if (tab.active) return `${ANSI.green}●${ANSI.reset}`;
    if (tab.discarded) return `${ANSI.yellow}z${ANSI.reset}`;
    if (tab.audible) return `${ANSI.green}♪${ANSI.reset}`;
    if (tab.status === "loading") return `${ANSI.cyan}◌${ANSI.reset}`;
    return `${ANSI.dim}○${ANSI.reset}`;
}

function resolveTabId(input) {
    const n = parseInt(input, 10);
    if (isNaN(n)) return null;
    // If it looks like a short index (1-999), resolve from cache
    if (n < 1000 && _indexMap[n] !== undefined) return _indexMap[n];
    // Otherwise treat as raw Chrome tab ID
    return n;
}

export async function cmdTabs(args) {
    const sub = args[0]?.toLowerCase();

    // ── LIST ─────────────────────────────────────────────────────
    if (!sub || sub === "list") {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs?.length) {
                    resolve(`${ANSI.red}[ERROR] No tabs found.${ANSI.reset}`);
                    return;
                }

                // Build index map and group by host
                _indexMap = [];
                const groups = new Map();
                let idx = 1;

                for (const tab of tabs) {
                    _indexMap[idx] = tab.id;
                    tab._idx = idx++;
                    let host = "";
                    try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                    if (!groups.has(host)) groups.set(host, []);
                    groups.get(host).push(tab);
                }

                let o = `\n${ANSI.cyan}${ANSI.bold}  Tabs${ANSI.reset} ${ANSI.dim}${tabs.length} open · ${groups.size} sites${ANSI.reset}\n`;

                for (const [host, hostTabs] of groups) {
                    const count = hostTabs.length > 1 ? ` ${ANSI.dim}(${hostTabs.length})${ANSI.reset}` : "";
                    o += `\n  ${ANSI.cyan}${host}${ANSI.reset}${count}\n`;

                    for (const tab of hostTabs) {
                        const num = `${ANSI.dim}${String(tab._idx).padStart(2)}${ANSI.reset}`;
                        let title = tab.title || "Untitled";
                        if (title.length > 28) title = title.substring(0, 27) + "…";
                        o += `  ${num} ${icon(tab)} ${title}\n`;
                    }
                }

                o += `\n${ANSI.dim}  tabs close <#> · tabs info <#>${ANSI.reset}\n`;
                resolve(o);
            });
        });
    }

    // ── CLOSE ────────────────────────────────────────────────────
    if (sub === "close") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs close <#>${ANSI.reset}`;
        const tabId = resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        const confirmed = args[2]?.toLowerCase() === "yes";

        try {
            const tab = await chrome.tabs.get(tabId);
            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";

            if (!confirmed) {
                let o = `\n${ANSI.yellow}[CONFIRM]${ANSI.reset} Close this tab?\n`;
                o += `  ${ANSI.white}${title}${ANSI.reset}\n`;
                o += `  ${ANSI.dim}${tab.url}${ANSI.reset}\n`;
                o += `\n${ANSI.dim}Run ${ANSI.white}tabs close ${args[1]} yes${ANSI.dim} to confirm.${ANSI.reset}`;
                return o;
            }

            return new Promise((resolve) => {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) {
                        resolve(`${ANSI.red}[ERROR] ${chrome.runtime.lastError.message}${ANSI.reset}`);
                    } else {
                        resolve(`${ANSI.green}[OK]${ANSI.reset} Closed: ${title}`);
                    }
                });
            });
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── INFO ─────────────────────────────────────────────────────
    if (sub === "info") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs info <#>${ANSI.reset}`;
        const tabId = resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            const sep = `${ANSI.dim}${"━".repeat(34)}${ANSI.reset}`;
            let o = `\n${ANSI.cyan}${ANSI.bold}  Tab #${args[1]}${ANSI.reset}\n  ${sep}\n`;
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

    return `${ANSI.red}Try: tabs · tabs close <#> · tabs info <#>${ANSI.reset}`;
}

