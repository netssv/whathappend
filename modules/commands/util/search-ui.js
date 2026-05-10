/**
 * @module modules/commands/util/search-ui.js
 * @description Inline smart search renderer for TUI menus.
 *              Fuzzy-filters commands across ALL sections from HELP_SECTIONS.
 *              Designed to be embedded into HelpRenderer or MenuRenderer.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', HELP_SECTIONS from '../../data/help-data.js'
 * - Imports: wrapAnsiText, renderMenuBlock, getMenuActionAt from '../../utils.js'
 * - Exports: SearchRenderer
 * - Layer: Command Layer (Util) — stateless view helper.
 */

import { ANSI } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { wrapAnsiText, renderMenuBlock, getMenuActionAt } from "../../utils.js";
import { HELP_SECTIONS } from "../../data/help-data.js";

// ── Search Logic ──────────────────────────────────────────────────────

/**
 * Fuzzy-match: checks if all characters in `query` appear in `target` in order.
 * Also handles exact word matches in name, desc, or aliases.
 */
function matchScore(query, name, desc, aliases) {
    const q = query.toLowerCase();
    const n = name.toLowerCase();
    const d = (desc || "").toLowerCase();
    const a = (aliases || "").toLowerCase();

    // Exact substring match in name or aliases = highest priority
    if (n.includes(q)) return 3;
    if (a.includes(q)) return 2;
    if (d.includes(q)) return 1;

    // Fuzzy: all chars of query appear in name in order
    let pos = 0;
    for (const ch of q) {
        const idx = n.indexOf(ch, pos);
        if (idx === -1) return 0;
        pos = idx + 1;
    }
    return 0.5;
}

/**
 * Search across ALL help sections for commands matching the query.
 * Returns array of { cmd, desc, aliases, section } sorted by score.
 */
export function searchCommands(query) {
    if (!query || query.length < 1) return [];
    const results = [];
    for (const sec of HELP_SECTIONS) {
        for (const [name, desc, aliases] of sec.cmds) {
            const score = matchScore(query, name, desc, aliases);
            if (score > 0) {
                results.push({ cmd: name, desc, aliases: aliases || "", section: sec.title, score });
            }
        }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 18);
}

// ── Renderer ──────────────────────────────────────────────────────────

export class SearchRenderer {
    constructor(term) {
        this.term = term;
        this.rowMap = {};
        this.query = "";
        this.results = [];
        this.hoveredAction = null;
    }

    update(query, hoveredAction = null) {
        this.query = query;
        this.results = searchCommands(query);
        this.hoveredAction = hoveredAction;
        this.draw();
    }

    draw() {
        this.rowMap = {};
        const cols = this.term.cols || getTermCols() || 80;
        const rows = this.term.rows || 24;

        const lines = [];
        const footerLines = [];
        const pushLine = (arr, str, action = null) => arr.push({ str, action });
        const writeWrapped = (str, action = null) => {
            for (const l of wrapAnsiText(str, cols)) pushLine(lines, l, action);
        };
        const writeFooter = (str, action = null) => {
            for (const l of wrapAnsiText(str, cols)) pushLine(footerLines, l, action);
        };

        // Header
        pushLine(lines, `  ${ANSI.bold}${ANSI.cyan}// SEARCH //${ANSI.reset}  ${ANSI.dim}type to filter, Esc to cancel${ANSI.reset}`);
        pushLine(lines, `  ${ANSI.white}> ${ANSI.bold}${this.query}${ANSI.reset}${ANSI.cyan}_${ANSI.reset}`);
        pushLine(lines, "");

        if (!this.query) {
            writeWrapped(`  ${ANSI.dim}Start typing... e.g. ${ANSI.white}email${ANSI.dim}, ${ANSI.white}mx${ANSI.dim}, ${ANSI.white}ssl${ANSI.dim}, ${ANSI.white}dns${ANSI.reset}`);
        } else if (this.results.length === 0) {
            writeWrapped(`  ${ANSI.red}No results for "${this.query}"${ANSI.reset}`);
            writeWrapped(`  ${ANSI.dim}Try: ${ANSI.white}dns${ANSI.dim}, ${ANSI.white}ssl${ANSI.dim}, ${ANSI.white}mail${ANSI.dim}, ${ANSI.white}sec${ANSI.reset}`);
        } else {
            const isWide = cols >= 80;

            if (isWide) {
                // Two-column compact grid
                const half = Math.ceil(this.results.length / 2);
                const midX = Math.floor(cols / 2);
                for (let i = 0; i < half; i++) {
                    const l = this.results[i];
                    const r = this.results[i + half];
                    const lVal = (i + 1).toString();
                    const lStr = `   ${ANSI.bold}[${lVal}]${ANSI.reset} ${ANSI.cyan}${l.cmd}${ANSI.reset}`;
                    let rStr = "", rVal = null;
                    if (r) {
                        rVal = (i + half + 1).toString();
                        rStr = `   ${ANSI.bold}[${rVal}]${ANSI.reset} ${ANSI.cyan}${r.cmd}${ANSI.reset}`;
                    }
                    pushLine(lines, "", { type: "grid", left: lVal, right: rVal, leftStr: lStr, rightStr: rStr, midX });
                }
            } else {
                for (let i = 0; i < this.results.length; i++) {
                    const { cmd } = this.results[i];
                    const val = (i + 1).toString();
                    writeWrapped(`   ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.cyan}${cmd}${ANSI.reset}`, val);
                }
            }
        }

        // Footer: show description of hovered result
        if (this.hoveredAction && this.results.length > 0) {
            const idx = parseInt(this.hoveredAction) - 1;
            if (idx >= 0 && idx < this.results.length) {
                const r = this.results[idx];
                const alias = r.aliases ? ` (aliases: ${r.aliases})` : "";
                writeFooter(`  ${ANSI.cyan}ℹ ${r.cmd}${alias}:${ANSI.reset} ${ANSI.dim}${r.desc}${ANSI.reset}`);
                writeFooter(`  ${ANSI.dim}Category: ${r.section}${ANSI.reset}`);
            }
        } else {
            writeFooter(" ");
            writeFooter(" ");
        }

        writeFooter(`  ${ANSI.dim}══════════════════════════${ANSI.reset}`);
        writeFooter(`  ${ANSI.dim}Press 1-9 or click to run.  ${ANSI.yellow}[Esc]${ANSI.dim} cancel${ANSI.reset}`);

        // Render
        let buffer = "\x1b[2J\x1b[3J\x1b[H";
        const availableRows = Math.max(5, rows - footerLines.length);
        let currentY = 1;
        const renderRes = renderMenuBlock(lines.slice(0, availableRows), this.hoveredAction, cols, this.rowMap, currentY, ANSI);
        buffer += renderRes.buffer;
        currentY = renderRes.currentY;
        while (currentY <= availableRows) { buffer += "\r\n"; currentY++; }
        buffer += renderMenuBlock(footerLines, this.hoveredAction, cols, this.rowMap, currentY, ANSI).buffer;
        buffer = buffer.replace(/\r\n$/, "");
        this.term.write(buffer);
    }

    getActionAt(y, x) {
        return getMenuActionAt(y, x, this.rowMap);
    }

    /** Get the command string for a result index (1-based string key) */
    getResultCmd(val) {
        const idx = parseInt(val) - 1;
        return (idx >= 0 && idx < this.results.length) ? this.results[idx].cmd : null;
    }
}
