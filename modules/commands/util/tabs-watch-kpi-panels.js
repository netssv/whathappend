/**
 * @module modules/commands/util/tabs-watch-kpi-panels.js
 * @description ASCII panel renderers for the three actionable KPI modules.
 *
 * Returns arrays of lines (not joined strings) for easy column integration.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: renderNetPanel, renderOriginPanel, renderExecPanel
 * - Layer: Command Layer (Util) — pure ANSI rendering.
 */

import { ANSI } from "../../formatter.js";

// ── Helpers ──────────────────────────────────────────────────────────

function meter(pct, w = 8, fillChar = "■", emptyChar = "□") {
    const clamped = Math.max(0, Math.min(100, pct));
    const filled = Math.round((clamped / 100) * w);
    const col = clamped > 80 ? ANSI.green : clamped > 40 ? ANSI.yellow : ANSI.red;
    return `${col}${fillChar.repeat(filled)}${ANSI.dim}${emptyChar.repeat(w - filled)}${ANSI.reset}`;
}

function meterInv(pct, w = 8) {
    const clamped = Math.max(0, Math.min(100, pct));
    const filled = Math.round((clamped / 100) * w);
    const col = clamped < 30 ? ANSI.green : clamped < 60 ? ANSI.yellow : ANSI.red;
    return `${col}${"■".repeat(filled)}${ANSI.dim}${"□".repeat(w - filled)}${ANSI.reset}`;
}

function splitBar(pctA, pctB, w = 10) {
    const fA = Math.round((pctA / 100) * w);
    const fB = w - fA;
    return `${ANSI.green}${"█".repeat(fA)}${ANSI.yellow}${"░".repeat(fB)}${ANSI.reset}`;
}

function lbl(text) { return `${ANSI.dim}${text}${ANSI.reset}`; }
function val(text, col = ANSI.white) { return `${col}${text}${ANSI.reset}`; }

// ── 1. Network Efficiency Panel ──────────────────────────────────────

/**
 * @param {object} eff - from computeNetEfficiency()
 * @param {number} sepW - section header width
 * @returns {string[]} array of lines
 */
export function renderNetPanel(eff, sepW) {
    const lines = [];
    const w = Math.max(6, Math.min(10, sepW - 28));
    lines.push(`  ${ANSI.cyan}${ANSI.bold}Net Efficiency${ANSI.reset} ${ANSI.dim}${"─".repeat(Math.max(2, sepW - 17))}${ANSI.reset}`);

    const effCol = eff.pct >= 60 ? ANSI.green : eff.pct >= 30 ? ANSI.yellow : ANSI.red;
    lines.push(`    ${lbl("Compress")} ${meter(eff.pct, w)} ${effCol}${eff.pct}%${ANSI.reset} ${lbl(eff.grade)}`);

    if (eff.uncompressed > 0) {
        lines.push(`    ${lbl("No-gzip")}  ${ANSI.yellow}${eff.uncompressed}${ANSI.reset} ${lbl("resources uncompressed")}`);
    } else {
        lines.push(`    ${lbl("Status")}   ${ANSI.green}✓${ANSI.reset} ${lbl("All compressed")}`);
    }

    if (eff.savingsBytes > 512) {
        lines.push(`    ${lbl("Savings")}  ${ANSI.yellow}~${eff.savingsStr}${ANSI.reset} ${lbl("potential with Brotli")}`);
    }

    return lines;
}

// ── 2. Origin & Trust Panel ──────────────────────────────────────────

/**
 * @param {object} origin - from computeOriginTrust()
 * @param {number} sepW
 * @returns {string[]}
 */
export function renderOriginPanel(origin, sepW) {
    const lines = [];
    const w = Math.max(6, Math.min(10, sepW - 28));
    lines.push(`  ${ANSI.cyan}${ANSI.bold}Origin & Trust${ANSI.reset} ${ANSI.dim}${"─".repeat(Math.max(2, sepW - 17))}${ANSI.reset}`);

    lines.push(`    ${lbl("Domain")}  ${splitBar(origin.fpPct, origin.tpPct, w)} ${ANSI.green}${origin.fpPct}%${ANSI.reset}${lbl(" 1st")} ${ANSI.dim}│${ANSI.reset} ${ANSI.yellow}${origin.tpPct}%${ANSI.reset}${lbl(" 3rd")}`);

    if (origin.trackerCount > 0) {
        lines.push(`    ${lbl("Trackers")} ${ANSI.red}${origin.trackerCount}${ANSI.reset} ${lbl("tracking scripts detected")}`);
    }

    if (origin.sriMissing > 0) {
        const sriCol = origin.sriRisk === "high" ? ANSI.red : ANSI.yellow;
        lines.push(`    ${lbl("No-SRI")}   ${sriCol}${origin.sriMissing}${ANSI.reset} ${lbl("scripts without integrity")}`);
    } else {
        lines.push(`    ${lbl("SRI")}      ${ANSI.green}✓${ANSI.reset} ${lbl("All scripts verified")}`);
    }

    return lines;
}

// ── 3. Execution Health Panel ────────────────────────────────────────

/**
 * @param {object} exec - from computeExecHealth()
 * @param {number} sepW
 * @returns {string[]}
 */
export function renderExecPanel(exec, sepW) {
    const lines = [];
    const w = Math.max(6, Math.min(10, sepW - 28));
    lines.push(`  ${ANSI.cyan}${ANSI.bold}CPU Stress${ANSI.reset} ${ANSI.dim}${"─".repeat(Math.max(2, sepW - 13))}${ANSI.reset}`);

    const stCol = exec.stress === "critical" ? ANSI.red : exec.stress === "high" ? ANSI.red : exec.stress === "medium" ? ANSI.yellow : ANSI.green;
    lines.push(`    ${lbl("Thread")}   ${meterInv(exec.stressPct, w)} ${stCol}${exec.stressLabel}${ANSI.reset}`);
    lines.push(`    ${lbl("TBT")}      ${stCol}${exec.tbt}ms${ANSI.reset} ${lbl("total blocking")}`);

    if (exec.junkBlocks !== "Clean") {
        const jC = exec.junkBlocks === "Critical" ? ANSI.red : ANSI.yellow;
        lines.push(`    ${lbl("Junk")}     ${jC}▲ ${exec.junkBlocks}${ANSI.reset} ${lbl("main thread lockup")}`);
    }

    lines.push(`    ${lbl("Cost")}     ${val(`${exec.execCost}%`)} ${lbl(`JS of LCP (${exec.execLabel})`)}`);

    return lines;
}
