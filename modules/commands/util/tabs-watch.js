import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs-watch — Live tab monitor (pseudo task-manager)
//
//  Polls a tab every 2s for JS Heap, DOM size, network data,
//  and estimated FPS. Writes directly to xterm in-place.
//  Stopped via Ctrl+C (handled by input manager).
// ===================================================================

function fmt(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(1)} ${u[i]}`;
}

function bar(pct, width = 16) {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    const color = pct > 75 ? ANSI.red : pct > 50 ? ANSI.yellow : ANSI.green;
    return `${color}${"█".repeat(filled)}${ANSI.dim}${"░".repeat(empty)}${ANSI.reset}`;
}

/**
 * Creates a watch controller that polls tab metrics.
 * Returns { start(term), stop() } — input manager calls stop on Ctrl+C.
 */
export function createTabWatcher(tabId, label) {
    let intervalId = null;
    let prevBytes = 0;
    let prevResCount = 0;
    let tick = 0;
    const LINES = 14; // how many lines the dashboard takes (for cursor rewind)

    async function poll(term) {
        try {
            const tab = await chrome.tabs.get(tabId);
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    const m = performance.memory || {};
                    const res = performance.getEntriesByType("resource");
                    let totalBytes = 0;
                    for (const r of res) totalBytes += (r.transferSize || 0);

                    // FPS estimate via last animation frame delta
                    const navEntries = performance.getEntriesByType("navigation");
                    const nav = navEntries[0] || {};

                    return {
                        usedHeap: m.usedJSHeapSize || 0,
                        totalHeap: m.totalJSHeapSize || 0,
                        heapLimit: m.jsHeapSizeLimit || 0,
                        domNodes: document.getElementsByTagName("*").length,
                        resCount: res.length,
                        netBytes: totalBytes,
                        domReady: nav.domContentLoadedEventEnd || 0,
                        fullLoad: nav.loadEventEnd || 0,
                    };
                },
            });

            const d = results?.[0]?.result;
            if (!d) return;

            // Calculate deltas
            const byteDelta = d.netBytes - prevBytes;
            const newRes = d.resCount - prevResCount;
            prevBytes = d.netBytes;
            prevResCount = d.resCount;

            const heapPct = d.heapLimit > 0 ? ((d.usedHeap / d.heapLimit) * 100) : 0;
            const domColor = d.domNodes > 3000 ? ANSI.red : d.domNodes > 1500 ? ANSI.yellow : ANSI.green;

            // Rewind cursor to overwrite previous frame (skip on first tick)
            if (tick > 0) {
                term.write(`\x1b[${LINES}A`); // move up N lines
            }

            const elapsed = tick * 2;
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            const timeStr = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;

            let host = "";
            try { host = new URL(tab.url).hostname; } catch { host = ""; }

            // Build frame — each line must be padded to full width to overwrite old content
            const w = term.cols || 40;
            const pad = (s) => {
                // Strip ANSI for length calc
                const raw = s.replace(/\x1b\[[0-9;]*m/g, "");
                const need = Math.max(0, w - raw.length - 1);
                return s + " ".repeat(need);
            };

            const lines = [
                `${ANSI.cyan}${ANSI.bold}  ⟳ Watch #${label}${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}`,
                `${ANSI.dim}  ${"━".repeat(Math.min(34, w - 4))}${ANSI.reset}`,
                `  ${ANSI.white}Heap${ANSI.reset}   ${bar(heapPct)} ${heapPct.toFixed(1)}%`,
                `         ${ANSI.dim}${fmt(d.usedHeap)} / ${fmt(d.heapLimit)}${ANSI.reset}`,
                `  ${ANSI.white}DOM${ANSI.reset}    ${domColor}${d.domNodes.toLocaleString()}${ANSI.reset} nodes`,
                `  ${ANSI.white}Assets${ANSI.reset} ${d.resCount}${newRes > 0 ? ` ${ANSI.green}+${newRes}${ANSI.reset}` : ""}`,
                `${ANSI.dim}  ${"━".repeat(Math.min(34, w - 4))}${ANSI.reset}`,
                `  ${ANSI.white}Net Σ${ANSI.reset}  ${fmt(d.netBytes)}`,
                `  ${ANSI.white}Δ/2s${ANSI.reset}   ${byteDelta > 0 ? `${ANSI.yellow}+${fmt(byteDelta)}${ANSI.reset}` : `${ANSI.dim}0 B${ANSI.reset}`}`,
                `${ANSI.dim}  ${"━".repeat(Math.min(34, w - 4))}${ANSI.reset}`,
                `  ${ANSI.white}Load${ANSI.reset}   ${d.fullLoad > 0 ? `${(d.fullLoad / 1000).toFixed(2)}s` : `${ANSI.dim}N/A${ANSI.reset}`}`,
                `  ${ANSI.white}Up${ANSI.reset}     ${ANSI.dim}${timeStr}${ANSI.reset}`,
                ``,
                `${ANSI.dim}  Ctrl+C to stop${ANSI.reset}`,
            ];

            for (const l of lines) {
                term.write(`\x1b[2K\r${pad(l)}\r\n`);
            }

            tick++;
        } catch {
            // Tab closed or restricted — stop gracefully
            stop();
        }
    }

    function start(term) {
        tick = 0;
        prevBytes = 0;
        prevResCount = 0;
        poll(term); // first frame immediately
        intervalId = setInterval(() => poll(term), 2000);
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    return { start, stop };
}
