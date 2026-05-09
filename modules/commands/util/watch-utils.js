/**
 * @module modules/commands/util/watch-utils.js
 * @description Shared constants and helpers for watch sub-modules.
 *              Pure functions — no state, no Chrome API, no terminal I/O.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: TYPE_COLORS, TYPE_LABELS, fmtBytes, timeBar, extractFilename, getActiveTab
 * - Layer: Command Layer (Util) — stateless helpers.
 */

import { ANSI } from "../../formatter.js";

// ── Resource type → ANSI color ───────────────────────────────────────

export const TYPE_COLORS = {
    script:         "\x1b[33m",   // yellow
    stylesheet:     "\x1b[35m",   // magenta
    document:       "\x1b[36m",   // cyan
    xmlhttprequest: "\x1b[32m",   // green
    fetch:          "\x1b[32m",   // green
    image:          "\x1b[34m",   // blue
    font:           "\x1b[37m",   // white
    media:          "\x1b[31m",   // red
    websocket:      "\x1b[91m",   // bright red
    other:          "\x1b[90m",   // dim
};

// ── Resource type → short label ──────────────────────────────────────

export const TYPE_LABELS = {
    script: "JS", stylesheet: "CSS", document: "DOC",
    xmlhttprequest: "XHR", fetch: "XHR", image: "IMG",
    font: "FNT", media: "MED", websocket: "WS", other: "...",
};

// ── Formatting helpers ───────────────────────────────────────────────

/** Format byte count into a human-readable string (e.g. "1.5KB"). */
export function fmtBytes(bytes) {
    if (!bytes || bytes <= 0) return "---";
    const u = ["B", "KB", "MB"];
    let i = 0;
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(i > 0 ? 1 : 0)}${u[i]}`;
}

/** Build an ANSI timing bar of `width` chars, colored by duration. */
export function timeBar(durationMs, maxMs, width) {
    const w = Math.max(1, Math.round((durationMs / maxMs) * width));
    const empty = Math.max(0, width - w);
    const color = durationMs > 1000 ? ANSI.red : durationMs > 300 ? ANSI.yellow : ANSI.green;
    return `${color}${"█".repeat(w)}${ANSI.dim}${"░".repeat(empty)}${ANSI.reset}`;
}

/** Extract a readable filename from a URL, truncated to maxLen. */
export function extractFilename(url, maxLen) {
    try {
        const u = new URL(url);
        let name = u.pathname.split("/").pop() || u.hostname;
        if (u.search) name += "?" + u.search.substring(1, 12) + "…";
        return name.length > maxLen ? name.substring(0, maxLen - 1) + "…" : name;
    } catch {
        return url.substring(0, maxLen);
    }
}

// ── Chrome helper ────────────────────────────────────────────────────

/** Resolve the current active tab, or reject with an error message. */
export function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs?.[0]) resolve(tabs[0]);
            else reject(`${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`);
        });
    });
}

// ── Watch Lifecycle (badge + tab-switch modal) ───────────────────────

/**
 * Manages the visual lifecycle of a running watcher:
 *   - Sets a "LIVE" badge on the extension icon while active.
 *   - Shows a modal popup when the user switches tabs, offering
 *     to switch the watcher to the new tab or stop it.
 *   - Cleans up everything on dispose().
 *
 * Usage:
 *   const lifecycle = new WatchLifecycle(tabId, {
 *       onSwitch(newTabId) { ... restart on new tab ... },
 *       onStop()           { ... stop watcher ... },
 *   });
 *   lifecycle.activate();
 *   lifecycle.dispose();
 */
export class WatchLifecycle {
    /**
     * @param {number} tabId
     * @param {{ onSwitch: (newTabId: number) => void, onStop: () => void }} callbacks
     */
    constructor(tabId, callbacks) {
        this._tabId = tabId;
        this._callbacks = callbacks;
        this._onActivated = null;
        this._host = "";
        this._modalPending = false;
        this._disposed = false;
        this._suppressUntil = 0; // timestamp — suppress popup until this time
    }

    /** Start the badge and tab-switch listener. */
    activate() {
        // Resolve hostname for display
        chrome.tabs.get(this._tabId, (tab) => {
            try { this._host = new URL(tab?.url).hostname; } catch {}
        });

        // Tab-switch listener — shows modal popup
        this._onActivated = async (info) => {
            if (this._disposed || this._modalPending) return;
            if (info.tabId === this._tabId) return;
            // Suppress popup for 30s after user dismisses it
            if (Date.now() < this._suppressUntil) return;

            this._modalPending = true;

            try {
                const { showChoice } = await import("../../terminal/modal/modal-confirm.js");
                const newTab = await chrome.tabs.get(info.tabId);
                let newHost = "";
                try { newHost = new URL(newTab.url).hostname; } catch {}

                const result = await showChoice({
                    title: "⟳ Watch Active",
                    message: `Monitoring <span style="color:#10b981">${this._host}</span> but you switched to <span style="color:#fff">${newHost || "another tab"}</span>.`,
                    choices: [
                        { label: `Switch to ${newHost || "new tab"}`, value: "switch", primary: true },
                        { label: "Stop Watch", value: "stop" },
                    ],
                });

                if (this._disposed) return;

                if (result === "switch") {
                    this._callbacks?.onSwitch?.(info.tabId);
                } else if (result === "stop") {
                    this._callbacks?.onStop?.();
                } else {
                    // Cancel/dismiss — suppress popup for 30 seconds
                    this._suppressUntil = Date.now() + 30000;
                }
            } catch {
                // Modal failed — keep watching
            } finally {
                this._modalPending = false;
            }
        };
        chrome.tabs.onActivated.addListener(this._onActivated);
    }

    /** Remove badge and listener. */
    dispose() {
        this._disposed = true;
        if (this._onActivated) {
            chrome.tabs.onActivated.removeListener(this._onActivated);
            this._onActivated = null;
        }
    }
}
