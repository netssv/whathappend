/**
 * @module modules/commands/util/watch-raw.js
 * @description Raw streaming watcher — logs every network request
 *              as it arrives with full URLs, no truncation.
 *
 * @connections
 * - Imports: ANSI, TYPE_COLORS, TYPE_LABELS, fmtBytes from watch-utils
 * - Exports: createRawWatcher
 * - Layer: Command Layer (Util) — stateful watcher, append-only output.
 */

import { ANSI } from "../../formatter.js";
import { TYPE_COLORS, TYPE_LABELS, fmtBytes, WatchLifecycle } from "./watch-utils.js";

/**
 * Creates a streaming raw watcher that prints each new request as a log line.
 * @param {number} tabId
 * @returns {{ start: Function, stop: Function }}
 */
export function createRawWatcher(tabId) {
    let pollInterval = null;
    let prevCount = 0;
    let headerPrinted = false;
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
                        status: e.responseStatus || 0,
                    }));
                },
            });

            const entries = results?.[0]?.result;
            if (!entries) return;

            // Print header once
            if (!headerPrinted) {
                let host = "";
                try { host = new URL(tab.url).hostname; } catch {}
                term.writeln(`\n  ${ANSI.bold}${ANSI.cyan}⟳ RAW STREAM${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}`);
                term.writeln(`  ${ANSI.dim}${"─".repeat(Math.min(term.cols - 4, 60))}${ANSI.reset}`);
                term.writeln(`  ${ANSI.dim}Streaming network requests as they arrive...${ANSI.reset}\n`);
                headerPrinted = true;
            }

            // Only print NEW entries since last poll
            if (entries.length > prevCount) {
                for (const e of entries.slice(prevCount)) {
                    const typeKey = TYPE_LABELS[e.type] ? e.type : "other";
                    const color = TYPE_COLORS[typeKey] || TYPE_COLORS.other;
                    const label = (TYPE_LABELS[typeKey] || "...").padEnd(3);

                    const sizeStr = e.size > 0 ? fmtBytes(e.size) : "---";
                    const durStr = `${e.duration}ms`;
                    const statusStr = e.status > 0 ? `${e.status}` : "";

                    term.writeln(`  ${color}${label}${ANSI.reset} ${ANSI.dim}${durStr.padStart(6)} ${sizeStr.padStart(7)}${ANSI.reset} ${statusStr ? `${ANSI.yellow}${statusStr}${ANSI.reset} ` : ""}${e.name}`);
                }
            }
            prevCount = entries.length;

        } catch {
            stop();
        }
    }

    function start(term, doneCallback) {
        prevCount = 0;
        headerPrinted = false;
        _doneCallback = doneCallback || _doneCallback;
        lifecycle = new WatchLifecycle(_tabId, {
            onSwitch(newTabId) {
                if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
                lifecycle?.dispose();
                lifecycle = null;
                _tabId = newTabId;
                headerPrinted = false;
                prevCount = 0;
                start(term, _doneCallback);
            },
            onStop() {
                stop();
                if (_doneCallback) _doneCallback();
            },
        });
        lifecycle.activate();
        poll(term);
        pollInterval = setInterval(() => poll(term), 1500);
    }

    function stop() {
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        lifecycle?.dispose();
        lifecycle = null;
    }

    return { start, stop };
}
