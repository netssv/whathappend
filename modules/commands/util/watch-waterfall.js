/**
 * @module modules/commands/util/watch-waterfall.js
 * @description Graphical waterfall watcher — real-time resource timing bars.
 *              Full screen clear per frame, no cursor rewind fragility.
 *
 * @connections
 * - Imports: ANSI, TYPE_COLORS, TYPE_LABELS, fmtBytes, timeBar, extractFilename
 * - Exports: createWaterfallWatcher
 * - Layer: Command Layer (Util) — stateful watcher with full-screen redraw.
 */

import { ANSI } from "../../formatter.js";
import { TYPE_COLORS, TYPE_LABELS, fmtBytes, timeBar, extractFilename, WatchLifecycle } from "./watch-utils.js";

const MAX_ROWS = 40;

/**
 * Creates a waterfall watcher showing resource timing bars.
 * @param {number} tabId
 * @returns {{ start: Function, stop: Function }}
 */
export function createWaterfallWatcher(tabId) {
    let pollInterval = null;
    let prevCount = 0;
    let tick = 0;
    let requestLog = [];
    let totalBytes = 0;
    let totalRequests = 0;
    let lifecycle = null;
    let _tabId = tabId;
    let _doneCallback = null;

    async function poll(term) {
        try {
            const tab = await chrome.tabs.get(_tabId);
            const results = await chrome.scripting.executeScript({
                target: { tabId: _tabId },
                func: () => {
                    return performance.getEntriesByType("resource").map(e => ({
                        name: e.name,
                        type: e.initiatorType || "other",
                        duration: Math.round(e.duration),
                        size: e.transferSize || e.encodedBodySize || e.decodedBodySize || 0,
                    }));
                },
            });

            const entries = results?.[0]?.result;
            if (!entries) return;

            // Accumulate new entries
            if (entries.length > prevCount) {
                for (const e of entries.slice(prevCount)) {
                    totalRequests++;
                    totalBytes += e.size;
                    requestLog.push(e);
                }
                if (requestLog.length > MAX_ROWS) {
                    requestLog = requestLog.slice(requestLog.length - MAX_ROWS);
                }
            }
            prevCount = entries.length;

            draw(term, tab);
            tick++;
        } catch {
            stop();
        }
    }

    function draw(term, tab) {
        term.write("\x1b[2J\x1b[H");
        const w = term.cols || 60;
        const barWidth = Math.max(6, Math.min(20, w - 48));
        const nameWidth = Math.max(10, w - barWidth - 22);

        let host = "";
        try { host = new URL(tab.url).hostname; } catch {}

        const elapsed = tick * 2;
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const uptime = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;

        // ── Header ───────────────────────────────────────────────
        let out = `\n  ${ANSI.bold}${ANSI.cyan}⟳ WATCH${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        out += `  ${ANSI.dim}${"━".repeat(Math.min(w - 4, 50))}${ANSI.reset}\n`;
        out += `  ${ANSI.white}Requests:${ANSI.reset} ${ANSI.cyan}${totalRequests}${ANSI.reset}`;
        out += `  ${ANSI.white}Size:${ANSI.reset} ${ANSI.yellow}${fmtBytes(totalBytes)}${ANSI.reset}`;
        out += `  ${ANSI.white}Up:${ANSI.reset} ${ANSI.dim}${uptime}${ANSI.reset}\n\n`;

        // ── Column headers ───────────────────────────────────────
        out += `  ${ANSI.dim}TYPE  ${"RESOURCE".padEnd(nameWidth)} SIZE     TIMING${ANSI.reset}\n`;
        out += `  ${ANSI.dim}${"─".repeat(Math.min(w - 4, 60))}${ANSI.reset}\n`;

        // ── Rows ─────────────────────────────────────────────────
        const maxDur = Math.max(100, ...requestLog.map(e => e.duration));
        const maxVisible = Math.max(5, (term.rows || 24) - 11);
        const visible = requestLog.slice(-maxVisible);

        if (visible.length === 0) {
            out += `\n  ${ANSI.dim}Waiting for network activity...${ANSI.reset}\n`;
        } else {
            for (const entry of visible) {
                const typeKey = TYPE_LABELS[entry.type] ? entry.type : "other";
                const color = TYPE_COLORS[typeKey] || TYPE_COLORS.other;
                const label = TYPE_LABELS[typeKey] || "...";
                const name = extractFilename(entry.name, nameWidth);
                const sizeStr = fmtBytes(entry.size).padStart(6);

                out += `  ${color}${label}${ANSI.reset}  ${name.padEnd(nameWidth)} ${ANSI.dim}${sizeStr}${ANSI.reset}  ${timeBar(entry.duration, maxDur, barWidth)} ${ANSI.dim}${entry.duration}ms${ANSI.reset}\n`;
            }

            if (requestLog.length > maxVisible) {
                out += `  ${ANSI.dim}...${requestLog.length - maxVisible} earlier requests hidden${ANSI.reset}\n`;
            }
        }

        // ── Legend ────────────────────────────────────────────────
        out += `\n  ${ANSI.dim}${"─".repeat(Math.min(w - 4, 60))}${ANSI.reset}\n`;
        out += `  ${TYPE_COLORS.script}JS${ANSI.reset} `;
        out += `${TYPE_COLORS.stylesheet}CSS${ANSI.reset} `;
        out += `${TYPE_COLORS.xmlhttprequest}XHR${ANSI.reset} `;
        out += `${TYPE_COLORS.image}IMG${ANSI.reset} `;
        out += `${TYPE_COLORS.document}DOC${ANSI.reset} `;
        out += `${TYPE_COLORS.font}FNT${ANSI.reset} `;
        out += `${TYPE_COLORS.media}MED${ANSI.reset} `;
        out += `${TYPE_COLORS.websocket}WS${ANSI.reset}`;
        out += `  ${ANSI.dim}│ Ctrl+C exit${ANSI.reset}\n`;

        term.write(out);
    }

    function start(term, doneCallback) {
        tick = 0; prevCount = 0; totalBytes = 0; totalRequests = 0; requestLog = [];
        _doneCallback = doneCallback || _doneCallback;
        lifecycle = new WatchLifecycle(_tabId, {
            onSwitch(newTabId) {
                // Pause current, restart on new tab
                if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
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
        poll(term);
        pollInterval = setInterval(() => poll(term), 2000);
    }

    function stop() {
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        lifecycle?.dispose();
        lifecycle = null;
    }

    return { start, stop };
}

