/**
 * @module modules/commands/util/tabs-watch.js
 * @description Live tab dashboard monitor (pseudo task-manager).
 *
 * Polls a tab every 2s for JS Heap, DOM size, network data by type,
 * page weight, and storage metrics. Uses full screen clear per frame.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: createTabWatcher
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { WatchLifecycle } from "./watch-utils.js";

// ── Helpers ──────────────────────────────────────────────────────────

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

// ── Dashboard Watcher ────────────────────────────────────────────────

/**
 * Creates a dashboard watcher that polls tab metrics with type breakdowns.
 * @param {number} tabId
 * @param {string} label
 */
export function createTabWatcher(tabId, label) {
    let intervalId = null;
    let prevBytes = 0;
    let tick = 0;
    let lifecycle = null;
    let _tabId = tabId;
    let _doneCallback = null;

    async function poll(term) {
        try {
            const tab = await chrome.tabs.get(_tabId);
            const results = await chrome.scripting.executeScript({
                target: { tabId: _tabId },
                func: () => {
                    const m = performance.memory || {};
                    const res = performance.getEntriesByType("resource");

                    // Aggregate by initiatorType
                    let totalBytes = 0;
                    const byType = {
                        script: { count: 0, bytes: 0 }, css: { count: 0, bytes: 0 },
                        img: { count: 0, bytes: 0 }, font: { count: 0, bytes: 0 },
                        xhr: { count: 0, bytes: 0 }, media: { count: 0, bytes: 0 },
                        other: { count: 0, bytes: 0 },
                    };

                    for (const r of res) {
                        const size = r.transferSize || r.encodedBodySize || r.decodedBodySize || 0;
                        totalBytes += size;

                        const t = r.initiatorType || "other";
                        if (t === "script") { byType.script.count++; byType.script.bytes += size; }
                        else if (t === "css" || t === "link" || t === "stylesheet") { byType.css.count++; byType.css.bytes += size; }
                        else if (t === "img" || t === "image") { byType.img.count++; byType.img.bytes += size; }
                        else if (t === "font") { byType.font.count++; byType.font.bytes += size; }
                        else if (t === "xmlhttprequest" || t === "fetch") { byType.xhr.count++; byType.xhr.bytes += size; }
                        else if (t === "video" || t === "audio") { byType.media.count++; byType.media.bytes += size; }
                        else { byType.other.count++; byType.other.bytes += size; }
                    }

                    const nav = (performance.getEntriesByType("navigation") || [])[0] || {};
                    const docSize = nav.transferSize || nav.encodedBodySize || nav.decodedBodySize || 0;

                    // DOM elements
                    const scripts = document.querySelectorAll("script[src]").length;
                    const iframes = document.querySelectorAll("iframe").length;
                    const imgElements = document.querySelectorAll("img").length;
                    const linkElements = document.querySelectorAll("a[href]").length;
                    const videoElements = document.querySelectorAll("video").length;
                    const audioElements = document.querySelectorAll("audio").length;

                    // Playing media
                    const allMedia = document.querySelectorAll("video, audio");
                    let mediaPlaying = 0;
                    allMedia.forEach(el => { if (!el.paused) mediaPlaying++; });

                    // Storage
                    let storageKB = 0;
                    try { storageKB = Math.round(JSON.stringify(localStorage).length / 1024); } catch {}
                    let sessionKB = 0;
                    try { sessionKB = Math.round(JSON.stringify(sessionStorage).length / 1024); } catch {}

                    const cookies = document.cookie ? document.cookie.split(";").length : 0;

                    return {
                        usedHeap: m.usedJSHeapSize || 0,
                        heapLimit: m.jsHeapSizeLimit || 0,
                        domNodes: document.getElementsByTagName("*").length,
                        resCount: res.length,
                        netBytes: totalBytes,
                        docSize,
                        fullLoad: nav.loadEventEnd || 0,
                        byType,
                        scripts, iframes, imgElements, linkElements,
                        videoElements, audioElements,
                        mediaPlaying,
                        storageKB, sessionKB, cookies,
                    };
                },
            });

            const d = results?.[0]?.result;
            if (!d) return;

            const byteDelta = d.netBytes - prevBytes;
            prevBytes = d.netBytes;

            const heapPct = d.heapLimit > 0 ? ((d.usedHeap / d.heapLimit) * 100) : 0;
            const domC = d.domNodes > 3000 ? ANSI.red : d.domNodes > 1500 ? ANSI.yellow : ANSI.green;

            const elapsed = tick * 2;
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            const uptime = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;

            let host = "";
            try { host = new URL(tab.url).hostname; } catch { host = ""; }

            const w = term.cols || 40;
            const sw = Math.min(30, w - 4);
            const sep = `${ANSI.dim}  ${"━".repeat(sw)}${ANSI.reset}`;

            // Page weight
            const pageWeight = d.netBytes + d.docSize;
            const weightColor = pageWeight > 5 * 1024 * 1024 ? ANSI.red : pageWeight > 2 * 1024 * 1024 ? ANSI.yellow : ANSI.green;

            // Media badge
            const mediaTotal = d.videoElements + d.audioElements;
            let mediaStr = `${ANSI.dim}--${ANSI.reset}`;
            if (mediaTotal > 0) {
                mediaStr = d.mediaPlaying > 0
                    ? `${ANSI.green}▶ ${d.mediaPlaying}${ANSI.reset}${ANSI.dim}/${mediaTotal}${ANSI.reset}`
                    : `${ANSI.dim}⏸ ${mediaTotal}${ANSI.reset}`;
            }

            // Type breakdown helper
            const tb = (lbl, data, color) => {
                if (data.count === 0) return `  ${ANSI.dim}${lbl.padEnd(9)}--${ANSI.reset}`;
                return `  ${color}${lbl.padEnd(9)}${ANSI.reset}${data.count} ${ANSI.dim}(${fmt(data.bytes)})${ANSI.reset}`;
            };

            // ── Full screen clear + redraw ───────────────────────
            term.write("\x1b[2J\x1b[H");

            let out = "";
            out += `${ANSI.cyan}${ANSI.bold}  ⟳ Dashboard #${label}${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
            out += `${sep}\n`;
            out += `  ${ANSI.white}Heap${ANSI.reset}     ${bar(heapPct)} ${heapPct.toFixed(1)}%\n`;
            out += `           ${ANSI.dim}${fmt(d.usedHeap)} / ${fmt(d.heapLimit)}${ANSI.reset}\n`;
            out += `  ${ANSI.white}DOM${ANSI.reset}      ${domC}${d.domNodes.toLocaleString()}${ANSI.reset}  ${ANSI.dim}scripts${ANSI.reset} ${d.scripts}  ${ANSI.dim}iframes${ANSI.reset} ${d.iframes}\n`;
            out += `  ${ANSI.white}Page${ANSI.reset}     ${ANSI.dim}imgs${ANSI.reset} ${d.imgElements}  ${ANSI.dim}links${ANSI.reset} ${d.linkElements}  ${ANSI.dim}videos${ANSI.reset} ${d.videoElements}\n`;
            out += `${sep}\n`;
            out += `  ${ANSI.white}Weight${ANSI.reset}   ${weightColor}${fmt(pageWeight)}${ANSI.reset}  ${ANSI.white}Δ${ANSI.reset} ${byteDelta > 0 ? `${ANSI.yellow}+${fmt(byteDelta)}${ANSI.reset}` : `${ANSI.dim}--${ANSI.reset}`}\n`;
            out += `${tb("JS",     d.byType.script,  "\x1b[33m")}\n`;
            out += `${tb("CSS",    d.byType.css,     "\x1b[35m")}\n`;
            out += `${tb("Images", d.byType.img,     "\x1b[34m")}\n`;
            out += `${tb("XHR",    d.byType.xhr,     "\x1b[32m")}\n`;
            out += `${tb("Fonts",  d.byType.font,    "\x1b[37m")}\n`;
            out += `${tb("Media",  d.byType.media,   "\x1b[31m")}\n`;
            out += `${sep}\n`;
            out += `  ${ANSI.white}AV${ANSI.reset}       ${mediaStr}\n`;
            out += `  ${ANSI.white}Storage${ANSI.reset}  ${ANSI.dim}local${ANSI.reset} ${d.storageKB}KB  ${ANSI.dim}session${ANSI.reset} ${d.sessionKB}KB  ${ANSI.dim}cookies${ANSI.reset} ${d.cookies}\n`;
            out += `${sep}\n`;
            out += `  ${ANSI.white}Load${ANSI.reset}     ${d.fullLoad > 0 ? `${(d.fullLoad / 1000).toFixed(2)}s` : `${ANSI.dim}N/A${ANSI.reset}`}  ${ANSI.white}Up${ANSI.reset} ${ANSI.dim}${uptime}${ANSI.reset}\n`;
            out += `\n`;
            out += `${ANSI.dim}  Ctrl+C to exit${ANSI.reset}\n`;

            term.write(out);
            tick++;
        } catch {
            stop();
        }
    }

    function start(term, doneCallback) {
        tick = 0;
        prevBytes = 0;
        _doneCallback = doneCallback || _doneCallback;
        lifecycle = new WatchLifecycle(_tabId, {
            onSwitch(newTabId) {
                if (intervalId) { clearInterval(intervalId); intervalId = null; }
                lifecycle?.dispose();
                lifecycle = null;
                _tabId = newTabId;
                start(term, _doneCallback);
            },
            onStop() {
                stop();
                if (_doneCallback) _doneCallback();
            },
        });
        lifecycle.activate();
        term.write("\x1b[2J\x1b[H");
        poll(term);
        intervalId = setInterval(() => poll(term), 2000);
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        lifecycle?.dispose();
        lifecycle = null;
    }

    return { start, stop };
}

