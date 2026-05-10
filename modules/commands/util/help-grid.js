/**
 * @module modules/commands/util/help-grid.js
 * @description Pure builders for the Help TUI command grid and info footer.
 *              Produces `{ str, action }` line arrays consumed by renderMenuBlock.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Imports: wrapAnsiText, buildPageDots from '../../utils.js'
 * - Exports: buildCommandGrid, resolveHoverInfo, buildFooter, keyLabel
 * - Layer: Command Layer (Util) — stateless view data builders.
 */

import { ANSI } from "../../formatter.js";
import { wrapAnsiText, buildPageDots } from "../../utils.js";

// ── Key Label ─────────────────────────────────────────────────────────

/** Convert a zero-based index to its display key: 0→"1", 9→"a" */
export function keyLabel(i) {
    return i < 9 ? (i + 1).toString() : String.fromCharCode(97 + i - 9);
}

// ── Command Grid ──────────────────────────────────────────────────────

/**
 * Build the compact command grid lines for a section.
 * Returns an array of `{ str, action }` objects.
 */
export function buildCommandGrid(section, cols) {
    const lines = [];
    const push  = (str, action = null) => lines.push({ str, action });

    if (cols >= 80) {
        // Two-column grid
        const half = Math.ceil(section.cmds.length / 2);
        const midX = Math.floor(cols / 2);
        for (let i = 0; i < half; i++) {
            const lIdx = i, rIdx = i + half;
            const lVal  = keyLabel(lIdx);
            const lStr  = _cmdCell(lVal, section.cmds[lIdx][0]);
            let rVal = null, rStr = "";
            if (rIdx < section.cmds.length) {
                rVal = keyLabel(rIdx);
                rStr = _cmdCell(rVal, section.cmds[rIdx][0]);
            }
            push("", { type: "grid", left: lVal, right: rVal, leftStr: lStr, rightStr: rStr, midX });
        }
    } else {
        // Single column
        for (let i = 0; i < section.cmds.length; i++) {
            const val  = keyLabel(i);
            const cell = _cmdCell(val, section.cmds[i][0]);
            for (const l of wrapAnsiText(cell, cols)) push(l, val);
        }
    }
    return lines;
}

function _cmdCell(val, name) {
    return `   ${ANSI.bold}[${val.padStart(2)}]${ANSI.reset} ${ANSI.cyan}${name}${ANSI.reset}`;
}

// ── Hover Info ────────────────────────────────────────────────────────

/** Return the hover description line for a given action key, or a blank line. */
export function resolveHoverInfo(hoveredAction, section, cols) {
    const SKIP = new Set(["back", "quit", "BACK_QUIT", "prev", "next", "search"]);
    if (!hoveredAction || SKIP.has(hoveredAction)) return [{ str: " ", action: null }];

    let hovIdx = -1;
    if (hoveredAction >= "1" && hoveredAction <= "9") hovIdx = parseInt(hoveredAction) - 1;
    else if (hoveredAction.length === 1)              hovIdx = hoveredAction.charCodeAt(0) - 97 + 9;

    if (hovIdx < 0 || hovIdx >= section.cmds.length) return [{ str: " ", action: null }];

    const [hName, hDesc, hAliases] = section.cmds[hovIdx];
    const aliasText = hAliases ? ` (aliases: ${hAliases})` : "";
    const infoStr   = `  ${ANSI.cyan}ℹ ${hName}${aliasText}:${ANSI.reset} ${ANSI.dim}${hDesc}${ANSI.reset}`;
    return wrapAnsiText(infoStr, cols).map(s => ({ str: s, action: null }));
}

// ── Footer Lines ──────────────────────────────────────────────────────

/**
 * Build the footer lines: page-dot divider + nav hints + [Q]uit.
 * Accepts current (1-based) and total for the dots progress indicator.
 */
export function buildFooter(section, current, total, cols, ANSI_obj) {
    const A   = ANSI_obj ?? ANSI; // caller may pass ANSI explicitly
    const lines = [];
    const push  = (str, action = null) => {
        for (const l of wrapAnsiText(str, cols)) lines.push({ str: l, action });
    };

    const lastIdx = section.cmds.length - 1;
    const lastVal = keyLabel(lastIdx);
    const range   = section.cmds.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;

    // Page dots divider — replaces the plain ════ line
    const dots = buildPageDots(current, total, cols, A);
    lines.push({ str: `${A.dim}${dots}${A.reset}`, action: null });

    push(`  ${A.dim}[menu] runs commands · [help] shows docs   ${A.white}[/]${A.dim} to search${A.reset}`);
    push(`  ${A.dim}← → navigate · Press ${range} or click to view.${A.reset}`);
    push(`  ${A.red}[Q]uit${A.reset}`, "quit");
    return lines;
}
