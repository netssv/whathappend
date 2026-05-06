/**
 * @module modules/commands/util/tabs-watch.js
 * @description Live tab dashboard monitor — orchestrator.
 *
 * Polls the active tab every 2s and renders a full-screen dashboard.
 * Layout adapts to terminal width (compact / normal / wide).
 *
 * Sub-modules:
 *   tabs-watch-collector.js  — DOM injection (no imports, injected into page)
 *   tabs-watch-renderer.js   — Pure ANSI renderer (adaptive layout)
 *
 * Error tolerance: up to MAX_ERRORS consecutive poll failures are silently
 * skipped before the watcher stops. This prevents a blank screen when the
 * new tab is not yet scriptable right after a tab switch.
 *
 * @connections
 * - Imports: WatchLifecycle from './watch-utils.js'
 *            collectTabMetrics from './tabs-watch-collector.js'
 *            renderDashboard   from './tabs-watch-renderer.js'
 * - Exports: createTabWatcher
 * - Layer: Command Layer (Util)
 */

import { WatchLifecycle } from "./watch-utils.js";
import { collectTabMetrics } from "./tabs-watch-collector.js";
import { renderDashboard } from "./tabs-watch-renderer.js";
import { ContextManager } from "../../context.js";

// ── Constants ─────────────────────────────────────────────────────────

/** Consecutive poll failures tolerated before giving up. */
const MAX_ERRORS = 3;

/** Delay (ms) after tab switch before first poll — tab may not be scriptable yet. */
const SWITCH_DELAY_MS = 1000;

// ── Dashboard Watcher ────────────────────────────────────────────────

/**
 * Creates a live dashboard watcher for the given tab.
 * @param {number} tabId
 * @param {string} [label] - fallback label if hostname can't be resolved
 * @returns {{ start(term, doneCallback): void, stop(): void }}
 */
export function createTabWatcher(tabId, label = "⬤") {
    let intervalId    = null;
    let prevBytes     = 0;
    let tick          = 0;
    let errorCount    = 0;  // consecutive poll failures
    let lifecycle     = null;
    let _tabId        = tabId;
    let _doneCallback = null;

    // ── Poll ─────────────────────────────────────────────────────────

    async function poll(term) {
        try {
            const tab = await chrome.tabs.get(_tabId);

            const results = await chrome.scripting.executeScript({
                target: { tabId: _tabId },
                func: collectTabMetrics,
            });

            const d = results?.[0]?.result;
            if (!d) return;

            // Successful poll — reset error streak
            errorCount = 0;

            // Derived metrics
            const byteDelta  = Math.max(0, d.netBytes - prevBytes);
            prevBytes        = d.netBytes;
            const heapPct    = d.heapLimit > 0 ? (d.usedHeap / d.heapLimit) * 100 : 0;
            const pageWeight = d.netBytes + d.docSize;

            const elapsed = tick * 2;
            const mins    = Math.floor(elapsed / 60);
            const secs    = elapsed % 60;
            const uptime  = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

            let host = label;
            try { host = new URL(tab.url).hostname; } catch {}

            const cols = term.cols || 50;
            const rows = term.rows || 24;

            const frame = renderDashboard(d, {
                host, heapPct, pageWeight, byteDelta, uptime, tick, cols, rows,
            });

            term.write("\x1b[3J\x1b[2J\x1b[H");
            term.write(frame);
            tick++;

        } catch (err) {
            errorCount++;
            if (errorCount >= MAX_ERRORS) {
                // Too many failures — stop to avoid an infinite broken loop
                term.write(`\r\n\x1b[31m[WATCH ERROR] ${err.message || String(err)}\x1b[0m\r\n`);
                stop();
                if (_doneCallback) _doneCallback();
            }
            // Otherwise: silently skip poll — the tab may still be loading.
            // The next interval tick will try again automatically.
        }
    }

    // ── Lifecycle helpers ─────────────────────────────────────────────

    /** Write the "switching tab…" status screen. */
    function showSwitching(term) {
        term.write("\x1b[3J\x1b[2J\x1b[H");
        term.write(
            "\n\x1b[36m\x1b[1m  \u27f3 Switching tab\u2026\x1b[0m\n" +
            "\x1b[2m  Waiting for new tab to be ready\u2026\x1b[0m\n"
        );
    }

    // ── Start / Stop ─────────────────────────────────────────────────

    function start(term, doneCallback) {
        tick          = 0;
        prevBytes     = 0;
        errorCount    = 0;
        _doneCallback = doneCallback || _doneCallback;

        lifecycle = new WatchLifecycle(_tabId, {
            async onSwitch(newTabId) {
                // 1. Stop current poll loop without disposing doneCallback
                if (intervalId) { clearInterval(intervalId); intervalId = null; }
                lifecycle?.dispose();
                lifecycle = null;
                _tabId = newTabId;

                // Update global terminal header Context
                try {
                    const newTab = await chrome.tabs.get(newTabId);
                    if (newTab && newTab.url && newTab.url.startsWith("http")) {
                        const newHost = new URL(newTab.url).hostname;
                        ContextManager.setManualTarget(newHost);
                    }
                } catch {}

                // 2. Show transitional screen immediately
                showSwitching(term);

                // 3. Delay restart so the new tab has time to be scriptable
                setTimeout(() => start(term, _doneCallback), SWITCH_DELAY_MS);
            },
            onStop() {
                stop();
                if (_doneCallback) _doneCallback();
            },
        });

        lifecycle.activate();
        term.write("\x1b[3J\x1b[2J\x1b[H");
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
