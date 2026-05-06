/**
 * @module modules/commands/util/watch.js
 * @description Live network activity monitor — command router.
 *              Routes to the appropriate watcher based on sub-command.
 *
 * Architecture:
 *   watch.js            — Router (this file): resolves mode + active tab
 *   watch-utils.js      — Shared constants & helpers (TYPE_COLORS, fmtBytes, etc.)
 *   watch-waterfall.js  — Graphical waterfall with timing bars (default)
 *   watch-raw.js        — Streaming log of full URLs (append-only)
 *   tabs-watch.js       — Aggregated dashboard (heap, DOM, page weight)
 *
 * @connections
 * - Imports: getActiveTab, createWaterfallWatcher, createRawWatcher, createTabWatcher
 * - Exports: cmdWatch
 * - Layer: Command Layer (Util) — stateless router.
 */

import { getActiveTab } from "./watch-utils.js";
import { createWaterfallWatcher } from "./watch-waterfall.js";
import { createRawWatcher } from "./watch-raw.js";
import { createTabWatcher } from "./tabs-watch.js";

// ── Mode aliases ─────────────────────────────────────────────────────

const RAW_ALIASES       = new Set(["raw", "log", "stream"]);
const WATERFALL_ALIASES = new Set(["waterfall", "timeline", "flow"]);

// ── Entry Point ──────────────────────────────────────────────────────

/**
 * @param {string[]} args - ["raw"|"dashboard"] or empty for waterfall
 */
export async function cmdWatch(args) {
    const sub = args[0]?.toLowerCase();

    try {
        const tab = await getActiveTab();

        if (WATERFALL_ALIASES.has(sub)) {
            return { __watch: true, watcher: createWaterfallWatcher(tab.id) };
        }

        // Default: dashboard
        return { __watch: true, watcher: createTabWatcher(tab.id, "⬤") };
    } catch (errorMsg) {
        return errorMsg; // Already formatted ANSI error from getActiveTab
    }
}
