/**
 * @module modules/terminal/render-queue.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - acquireWriteLock, releaseWriteLock from './write-lock.js'
 * - Exports: RenderQueue
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

import { acquireWriteLock, releaseWriteLock } from "./write-lock.js";

// ===================================================================
// Render Queue — Batched terminal write engine
//
// Queues cursor-relative overwrites and flushes them as a single
// atomic terminal operation to avoid flickering/ghosting.
// ===================================================================

export class RenderQueue {
    /**
     * @param {Terminal} term — xterm.js terminal instance
     */
    constructor(term) {
        this._term = term;
        this._queue = [];
        this._flushScheduled = false;
        this._cancelled = false;
    }

    /**
     * Queue an overwrite at the given cursor-relative delta.
     * @param {number} delta — lines above current cursor
     * @param {string} content — formatted line content
     */
    enqueue(delta, content) {
        if (this._cancelled || delta <= 0) return;
        this._queue.push({ delta, content });
        this._scheduleFlush();
    }

    /** Direct overwrite — bypasses queue (used by finalize). */
    writeNow(delta, content) {
        if (this._cancelled || delta <= 0) return;
        acquireWriteLock();
        try {
            this._term.write(
                `\x1b[s` +
                `\x1b[${delta}A` +
                `\x1b[2K\r` +
                content +
                `\x1b[u`
            );
        } finally {
            releaseWriteLock();
        }
    }

    cancel() {
        this._cancelled = true;
        this._queue.length = 0;
    }

    // -----------------------------------------------------------------
    // Internal flush mechanics
    // -----------------------------------------------------------------

    _scheduleFlush() {
        if (this._flushScheduled || this._cancelled) return;
        this._flushScheduled = true;
        setTimeout(() => {
            this._flushScheduled = false;
            if (!this._cancelled) this._flush();
        }, 0);
    }

    _flush() {
        if (this._queue.length === 0) return;

        // Deduplicate: keep only the LAST update per delta
        const byDelta = new Map();
        for (const op of this._queue) {
            byDelta.set(op.delta, op.content);
        }
        this._queue.length = 0;

        // Sort by delta descending (furthest rows first) for stable rendering
        const ops = [...byDelta.entries()].sort((a, b) => b[0] - a[0]);

        acquireWriteLock();
        try {
            for (const [delta, content] of ops) {
                if (delta > 0 && !this._cancelled) {
                    this._term.write(
                        `\x1b[s` +
                        `\x1b[${delta}A` +
                        `\x1b[2K\r` +
                        content +
                        `\x1b[u`
                    );
                }
            }
        } finally {
            releaseWriteLock();
        }
    }
}
