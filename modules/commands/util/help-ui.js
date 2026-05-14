/**
 * @module modules/commands/util/help-ui.js
 * @description Slim HelpRenderer class — orchestrates layout, delegates
 *              grid/footer building to help-grid.js and rendering to utils-tui.js.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', getTermCols from '../../state.js'
 * - Imports: renderMenuBlock, getMenuActionAt from '../../utils.js'
 * - Imports: HELP_SECTIONS from '../../data/help-data.js'
 * - Imports: buildCommandGrid, resolveHoverInfo, buildFooter from './help-grid.js'
 * - Exports: HelpRenderer, HELP_CATEGORIES
 * - Layer: Command Layer (Util) — stateful renderer (term state only).
 */

import { ANSI } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { renderMenuBlock, getMenuActionAt, buildPageDots } from "../../utils.js";
import { HELP_SECTIONS } from "../../data/help-data.js";
import { buildCommandGrid, resolveHoverInfo, buildFooter } from "./help-grid.js";

// ── Category Registry ─────────────────────────────────────────────────

export const HELP_CATEGORIES = HELP_SECTIONS.map(s => {
    return { key: s.key, section: s.title };
});

// ── Renderer ──────────────────────────────────────────────────────────

export class HelpRenderer {
    constructor(term) {
        this.term           = term;
        this.rowMap         = {};
        this.currentSection = 0;
        this.hoveredAction  = null;
        this.scrollTop      = 0;
    }

    scroll(direction) {
        this.scrollTop = direction === "up"
            ? Math.max(0, this.scrollTop - 3)
            : this.scrollTop + 3;
        this.draw(this.currentSection, this.hoveredAction);
    }

    draw(sectionIndex, hoveredAction = null) {
        const idx = Math.max(0, sectionIndex ?? 0);
        if (idx !== this.currentSection) this.scrollTop = 0;
        this.currentSection = idx;
        this.hoveredAction  = hoveredAction;
        this.rowMap         = {};

        const cols = this.term.cols || getTermCols() || 80;
        const rows = this.term.rows || 24;

        const cat     = HELP_CATEGORIES[idx];
        const section = cat ? HELP_SECTIONS.find(s => s.title === cat.section) : null;
        if (!section) return;

        // ── Body ─────────────────────────────────────────────────────
        const current = idx + 1, total = HELP_CATEGORIES.length;
        const lines = [
            { str: "", action: {
                type: "carousel",
                title: section.title.replace(/[^\x20-\x7E]/g, "").trim(),
                prefix: "HELP",
                cols, // ← required for exact hitbox calculation
            }},
            { str: "" },
            ...buildCommandGrid(section, cols),
            { str: "" },
        ];

        // ── Footer ────────────────────────────────────────────────────
        const footerLines = [
            ...resolveHoverInfo(hoveredAction, section, cols),
            ...buildFooter(section, current, total, cols, ANSI),
        ];

        // ── Render ────────────────────────────────────────────────────
        this._flush(lines, footerLines, cols, rows);
    }

    _flush(lines, footerLines, cols, rows) {
        const availableRows = Math.max(5, rows - footerLines.length);
        this.scrollTop = Math.max(0, Math.min(this.scrollTop, lines.length - availableRows));

        let buffer = "\x1b[2J\x1b[3J\x1b[H";
        let currentY = 1;

        const body = renderMenuBlock(
            lines.slice(this.scrollTop, this.scrollTop + availableRows),
            this.hoveredAction, cols, this.rowMap, currentY, ANSI
        );
        buffer   += body.buffer;
        currentY  = body.currentY;

        while (currentY <= availableRows) { buffer += "\r\n"; currentY++; }

        buffer += renderMenuBlock(footerLines, this.hoveredAction, cols, this.rowMap, currentY, ANSI).buffer;
        buffer  = buffer.replace(/\r\n$/, "");
        this.term.write(buffer);
    }

    // ── Query API ─────────────────────────────────────────────────────

    getActionAt(y, x)    { return getMenuActionAt(y, x, this.rowMap); }

    getCommandAt(index) {
        const sec = this._currentSection();
        return sec && index >= 0 && index < sec.cmds.length ? sec.cmds[index][0] : null;
    }

    getSectionCommandCount() {
        const sec = this._currentSection();
        return sec ? sec.cmds.length : 0;
    }

    _currentSection() {
        const cat = HELP_CATEGORIES[this.currentSection];
        return cat ? HELP_SECTIONS.find(s => s.title === cat.section) ?? null : null;
    }
}
