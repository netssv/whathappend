import { ANSI } from "../formatter.js";
import { acquireWriteLock, releaseWriteLock } from "./write-lock.js";
import { classifyInfrastructure } from "../data/infrastructure-map.js";

// ===================================================================
// Progressive Renderer — Live-updating triage skeleton
//
// Uses RELATIVE line counting for cursor positioning.
// All row updates go through a renderQueue that batches writes
// into atomic terminal operations via requestAnimationFrame.
// ===================================================================

const ROW_KEYS = ["registrar", "ns", "webhost"];

const ROW_LABELS = {
    registrar: `${ANSI.white}Registrar${ANSI.reset}`,
    ns:        `${ANSI.white}NameSrvs${ANSI.reset} `,
    webhost:   `${ANSI.white}Web Host${ANSI.reset} `,
};

const LOADING = `${ANSI.dim}⏳ loading...${ANSI.reset}`;
const NA      = `${ANSI.dim}N/A${ANSI.reset}`;

export { ROW_KEYS, ROW_LABELS };

/**
 * Skeleton geometry (lines after header):
 *
 *   [INFO] Domain Delegation:       ← header
 *   Registrar ━ ...                 ← offset 4 from cursor
 *   NameSrvs  ━ ...                 ← offset 3 from cursor
 *   Web Host  ━ ...                 ← offset 2 from cursor
 *   (blank — summary placeholder)   ← offset 1 from cursor
 *   [cursor here]                   ← offset 0
 */
const BASE_OFFSET = {
    registrar: 4,
    ns:        3,
    webhost:   2,
};
const SUMMARY_OFFSET = 1;

export class ProgressiveRenderer {
    /**
     * @param {Terminal} term — xterm.js terminal instance
     */
    constructor(term) {
        this._term = term;
        this._cancelled = false;
        this._resolved = {};     // Resolved values per row
        this._finalized = false;
        this._extraLines = 0;    // Lines written after skeleton
        this._renderQueue = [];  // Pending overwrite operations
        this._flushScheduled = false;
    }

    // -----------------------------------------------------------------
    // Render the initial skeleton
    // -----------------------------------------------------------------

    renderSkeleton() {
        if (this._cancelled) return;
        const t = this._term;

        t.writeln(`\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`);

        for (const key of ROW_KEYS) {
            t.writeln(this._formatRow(key, LOADING));
        }

        // Summary placeholder
        t.writeln("");
        this._extraLines = 0;
    }

    // -----------------------------------------------------------------
    // Track external writes (banner, user output, etc.)
    // -----------------------------------------------------------------

    addExternalLines(count = 1) {
        this._extraLines += count;
    }

    // -----------------------------------------------------------------
    // Update a single row — queues the write for batched flush
    // -----------------------------------------------------------------

    /**
     * @param {"registrar"|"ns"|"webhost"} rowKey
     * @param {string} value — formatted display value (may include ANSI)
     */
    updateRow(rowKey, value) {
        if (this._cancelled || this._finalized) return;
        if (!ROW_KEYS.includes(rowKey)) return;

        this._resolved[rowKey] = value || null;
        const display = value || NA;
        const delta = BASE_OFFSET[rowKey] + this._extraLines;

        if (delta <= 0) return;

        // Queue the overwrite and schedule a batched flush
        this._renderQueue.push({ delta, content: this._formatRow(rowKey, display) });
        this._scheduleFlush();
    }

    // -----------------------------------------------------------------
    // Confirmed count — non-null resolved values
    // -----------------------------------------------------------------

    getConfirmedCount() {
        return Object.values(this._resolved).filter(v => v !== null).length;
    }

    // -----------------------------------------------------------------
    // Finalize — GATEKEEPER + Infrastructure Correlation
    // -----------------------------------------------------------------

    /**
     * @param {string[]} providers — array of resolved provider names
     */
    finalize(providers) {
        if (this._cancelled || this._finalized) return;
        this._finalized = true;

        // Flush any pending row updates first
        this._flushQueue();

        // Ensure any still-loading rows show N/A
        for (const key of ROW_KEYS) {
            if (!(key in this._resolved)) {
                this._resolved[key] = null;
                const delta = BASE_OFFSET[key] + this._extraLines;
                if (delta > 0) {
                    this._overwriteNow(delta, this._formatRow(key, NA));
                }
            }
        }

        // GATEKEEPER: require at least 2 confirmed providers
        if (!providers || providers.length < 2) return;

        // ── Infrastructure Correlation ──────────────────────────
        // Use corporate affiliation map to detect parent/sibling companies
        const { consolidated, groupId } = classifyInfrastructure(providers);

        let summaryLine;
        if (consolidated) {
            const label = groupId || providers[0];
            summaryLine = `       ${ANSI.green}↳ Consolidated Stack (${label})${ANSI.reset}`;
        } else {
            summaryLine = `       ${ANSI.yellow}↳ Distributed Stack${ANSI.reset}`;
        }

        const delta = SUMMARY_OFFSET + this._extraLines;
        if (delta > 0) {
            this._overwriteNow(delta, summaryLine);
        }
    }

    // -----------------------------------------------------------------
    // Cancel
    // -----------------------------------------------------------------

    cancel() {
        this._cancelled = true;
        this._renderQueue.length = 0;
    }

    isCancelled() {
        return this._cancelled;
    }

    // -----------------------------------------------------------------
    // Render Queue — batched writes
    // -----------------------------------------------------------------

    /** Schedule a flush on the next animation frame (or microtask). */
    _scheduleFlush() {
        if (this._flushScheduled || this._cancelled) return;
        this._flushScheduled = true;

        // Use setTimeout(0) for Chrome extension compatibility
        // (requestAnimationFrame may not fire in sidepanel)
        setTimeout(() => {
            this._flushScheduled = false;
            if (!this._cancelled) {
                this._flushQueue();
            }
        }, 0);
    }

    /** Flush all pending overwrites as a single atomic terminal operation. */
    _flushQueue() {
        if (this._renderQueue.length === 0) return;

        // Deduplicate: keep only the LAST update per delta
        const byDelta = new Map();
        for (const op of this._renderQueue) {
            byDelta.set(op.delta, op.content);
        }
        this._renderQueue.length = 0;

        // Sort by delta descending (furthest rows first) for stable rendering
        const ops = [...byDelta.entries()].sort((a, b) => b[0] - a[0]);

        acquireWriteLock();
        try {
            for (const [delta, content] of ops) {
                if (delta > 0 && !this._cancelled) {
                    this._term.write(
                        `\x1b[s` +           // Save cursor
                        `\x1b[${delta}A` +   // Move up
                        `\x1b[2K\r` +        // Clear ENTIRE line first, then col 0
                        content +            // Write
                        `\x1b[u`             // Restore cursor
                    );
                }
            }
        } finally {
            releaseWriteLock();
        }
    }

    // -----------------------------------------------------------------
    // Direct overwrite (used by finalize, bypasses queue)
    // -----------------------------------------------------------------

    _overwriteNow(delta, content) {
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

    // -----------------------------------------------------------------
    // Format helper
    // -----------------------------------------------------------------

    _formatRow(key, value) {
        return `       ${ROW_LABELS[key]} ━ ${value}`;
    }
}
