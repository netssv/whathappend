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
    const LINES = 17; // how many lines the dashboard takes (for cursor rewind)

    async function poll(term) {
        try {
            const tab = await chrome.tabs.get(tabId);
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    const m = performance.memory || {};
                    const res = performance.getEntriesByType("resource");
                    let totalBytes = 0;
                    for (const r of res) {
                        totalBytes += (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0);
                    }

                    const nav = (performance.getEntriesByType("navigation") || [])[0] || {};
                    const conn = navigator.connection || navigator.mozConnection || {};

                    // Page anatomy
                    const scripts = document.querySelectorAll("script[src]").length;
                    const iframes = document.querySelectorAll("iframe").length;
                    const media = document.querySelectorAll("video, audio");
                    let mediaPlaying = 0;
                    media.forEach(el => { if (!el.paused) mediaPlaying++; });

                    // Storage
                    let storageKB = 0;
                    try { storageKB = Math.round(JSON.stringify(localStorage).length / 1024); } catch {}
                    let sessionKB = 0;
                    try { sessionKB = Math.round(JSON.stringify(sessionStorage).length / 1024); } catch {}

                    // Cookies
                    const cookies = document.cookie ? document.cookie.split(";").length : 0;

                    return {
                        usedHeap: m.usedJSHeapSize || 0,
                        heapLimit: m.jsHeapSizeLimit || 0,
                        domNodes: document.getElementsByTagName("*").length,
                        resCount: res.length,
                        netBytes: totalBytes,
                        fullLoad: nav.loadEventEnd || 0,
                        downlink: conn.downlink || 0,
                        rtt: conn.rtt || 0,
                        connType: conn.effectiveType || "",
                        scripts, iframes,
                        mediaTotal: media.length,
                        mediaPlaying,
                        storageKB, sessionKB, cookies,
                    };
                },
            });

            const d = results?.[0]?.result;
            if (!d) return;

            const byteDelta = d.netBytes - prevBytes;
            const newRes = d.resCount - prevResCount;
            prevBytes = d.netBytes;
            prevResCount = d.resCount;

            const heapPct = d.heapLimit > 0 ? ((d.usedHeap / d.heapLimit) * 100) : 0;
            const domC = d.domNodes > 3000 ? ANSI.red : d.domNodes > 1500 ? ANSI.yellow : ANSI.green;

            if (tick > 0) term.write(`\x1b[${LINES}A`);

            const elapsed = tick * 2;
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            const uptime = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;

            let host = "";
            try { host = new URL(tab.url).hostname; } catch { host = ""; }

            const w = term.cols || 40;
            const sw = Math.min(30, w - 4);
            const sep = `${ANSI.dim}  ${"━".repeat(sw)}${ANSI.reset}`;
            const pad = (s) => {
                const raw = s.replace(/\x1b\[[0-9;]*m/g, "");
                return s + " ".repeat(Math.max(0, w - raw.length - 1));
            };

            // Connection
            let linkStr = `${ANSI.dim}--${ANSI.reset}`;
            if (d.downlink > 0) {
                const c = d.downlink >= 10 ? ANSI.green : d.downlink >= 2 ? ANSI.yellow : ANSI.red;
                linkStr = `${c}${d.downlink}${ANSI.reset}${ANSI.dim}Mbps${ANSI.reset}`;
                if (d.connType) linkStr += ` ${ANSI.dim}${d.connType}${ANSI.reset}`;
            }

            // Media badge
            let mediaStr = `${ANSI.dim}--${ANSI.reset}`;
            if (d.mediaTotal > 0) {
                mediaStr = d.mediaPlaying > 0
                    ? `${ANSI.green}▶ ${d.mediaPlaying}${ANSI.reset}${ANSI.dim}/${d.mediaTotal}${ANSI.reset}`
                    : `${ANSI.dim}⏸ ${d.mediaTotal}${ANSI.reset}`;
            }

            const lines = [
                `${ANSI.cyan}${ANSI.bold}  ⟳ Watch #${label}${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}`,
                sep,
                `  ${ANSI.white}Heap${ANSI.reset}     ${bar(heapPct)} ${heapPct.toFixed(1)}%`,
                `           ${ANSI.dim}${fmt(d.usedHeap)} / ${fmt(d.heapLimit)}${ANSI.reset}`,
                `  ${ANSI.white}DOM${ANSI.reset}      ${domC}${d.domNodes.toLocaleString()}${ANSI.reset}  ${ANSI.dim}scripts${ANSI.reset} ${d.scripts}  ${ANSI.dim}iframes${ANSI.reset} ${d.iframes}`,
                `  ${ANSI.white}Assets${ANSI.reset}   ${d.resCount}${newRes > 0 ? ` ${ANSI.green}+${newRes}${ANSI.reset}` : ""}`,
                sep,
                `  ${ANSI.white}Net Σ${ANSI.reset}    ${d.netBytes > 0 ? fmt(d.netBytes) : `${ANSI.dim}CORS${ANSI.reset}`}  ${ANSI.white}Δ${ANSI.reset} ${byteDelta > 0 ? `${ANSI.yellow}+${fmt(byteDelta)}${ANSI.reset}` : `${ANSI.dim}--${ANSI.reset}`}`,
                `  ${ANSI.white}Link${ANSI.reset}     ${linkStr}  ${ANSI.white}RTT${ANSI.reset} ${d.rtt > 0 ? `${d.rtt}ms` : `${ANSI.dim}--${ANSI.reset}`}`,
                sep,
                `  ${ANSI.white}Media${ANSI.reset}    ${mediaStr}`,
                `  ${ANSI.white}Storage${ANSI.reset}  ${ANSI.dim}local${ANSI.reset} ${d.storageKB}KB  ${ANSI.dim}session${ANSI.reset} ${d.sessionKB}KB`,
                `  ${ANSI.white}Cookies${ANSI.reset}  ${d.cookies}`,
                sep,
                `  ${ANSI.white}Load${ANSI.reset}     ${d.fullLoad > 0 ? `${(d.fullLoad / 1000).toFixed(2)}s` : `${ANSI.dim}N/A${ANSI.reset}`}  ${ANSI.white}Up${ANSI.reset} ${ANSI.dim}${uptime}${ANSI.reset}`,
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
