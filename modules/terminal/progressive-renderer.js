import { ANSI } from "../formatter.js";
import { classifyInfrastructure } from "../data/infrastructure-map.js";
import { RenderQueue } from "./render-queue.js";

// ===================================================================
// Progressive Renderer — Live-updating triage skeleton
//
// Uses RELATIVE line counting for cursor positioning.
// Delegates all terminal writes to RenderQueue for atomic batching.
// ===================================================================

const ROW_KEYS = ["registrar", "ns", "webhost"];

const ROW_LABELS = {
    registrar: `${ANSI.white}Registrar${ANSI.reset}`,
    ns:        `${ANSI.white}NameSrvs${ANSI.reset} `,
    webhost:   `${ANSI.white}Web Host${ANSI.reset} `,
};

const LOADING = `${ANSI.dim}⏳ loading...${ANSI.reset}`;
const NA      = `${ANSI.dim}N/A${ANSI.reset}`;

const BASE_OFFSET = { registrar: 4, ns: 3, webhost: 2 };
const SUMMARY_OFFSET = 1;

export { ROW_KEYS, ROW_LABELS };

export class ProgressiveRenderer {
    constructor(term) {
        this._term = term;
        this._rq = new RenderQueue(term);
        this._cancelled = false;
        this._resolved = {};
        this._finalized = false;
        this._extraLines = 0;
    }

    // -----------------------------------------------------------------
    // Skeleton
    // -----------------------------------------------------------------

    renderSkeleton() {
        if (this._cancelled) return;
        const t = this._term;
        t.writeln(`\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`);
        for (const key of ROW_KEYS) {
            t.writeln(this._formatRow(key, LOADING));
        }
        t.writeln("");
        this._extraLines = 0;
    }

    addExternalLines(count = 1) { this._extraLines += count; }

    // -----------------------------------------------------------------
    // Row update
    // -----------------------------------------------------------------

    updateRow(rowKey, value) {
        if (this._cancelled || this._finalized) return;
        if (!ROW_KEYS.includes(rowKey)) return;

        this._resolved[rowKey] = value || null;
        const delta = BASE_OFFSET[rowKey] + this._extraLines;
        this._rq.enqueue(delta, this._formatRow(rowKey, value || NA));
    }

    getConfirmedCount() {
        return Object.values(this._resolved).filter(v => v !== null).length;
    }

    // -----------------------------------------------------------------
    // Finalize — GATEKEEPER + Infrastructure Correlation
    // -----------------------------------------------------------------

    finalize(providers) {
        if (this._cancelled || this._finalized) return;
        this._finalized = true;

        // Flush pending queue
        this._rq._flush();

        // Fill any still-loading rows with N/A
        for (const key of ROW_KEYS) {
            if (!(key in this._resolved)) {
                this._resolved[key] = null;
                const delta = BASE_OFFSET[key] + this._extraLines;
                this._rq.writeNow(delta, this._formatRow(key, NA));
            }
        }

        if (!providers || providers.length < 2) return;

        const { consolidated, groupId } = classifyInfrastructure(providers);
        const summaryLine = consolidated
            ? `       ${ANSI.green}↳ Consolidated Stack (${groupId || providers[0]})${ANSI.reset}`
            : `       ${ANSI.yellow}↳ Distributed Stack${ANSI.reset}`;

        const delta = SUMMARY_OFFSET + this._extraLines;
        this._rq.writeNow(delta, summaryLine);
    }

    // -----------------------------------------------------------------
    // Cancel
    // -----------------------------------------------------------------

    cancel() {
        this._cancelled = true;
        this._rq.cancel();
    }

    isCancelled() { return this._cancelled; }

    // -----------------------------------------------------------------
    // Format helper
    // -----------------------------------------------------------------

    _formatRow(key, value) {
        return `       ${ROW_LABELS[key]} ━ ${value}`;
    }
}
