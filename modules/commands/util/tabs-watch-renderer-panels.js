/**
 * @module modules/commands/util/tabs-watch-renderer-panels.js
 * @description Sub-panels for the dashboard renderer: Source Analysis
 *              table, Security Score badge, TTFB breakdown bars.
 *
 * Pure ANSI rendering — no Chrome API, no state.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: renderSourceTable, renderTTFBBreakdown, renderSecurityBadge
 * - Layer: Command Layer (Util) — pure rendering.
 */

import { ANSI } from "../../formatter.js";

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(b) {
    if (!b || b <= 0) return "0B";
    const u = ["B", "KB", "MB", "GB"]; let i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return `${b.toFixed(i > 0 ? 1 : 0)}${u[i]}`;
}

function bar(pct, w, col) {
    const c = Math.max(0, Math.min(100, pct)), f = Math.round((c / 100) * w);
    return `${col}${"█".repeat(f)}${ANSI.dim}${"░".repeat(w - f)}${ANSI.reset}`;
}

// ── Source Analysis Table ────────────────────────────────────────────

// Fixed column widths: TYPE=8, #=4, SIZE=8, LAT=6, STATUS=9
const TW = [8, 4, 8, 6, 9];
function cell(val, i, col) { return `${col || ""}${String(val).padEnd(TW[i])}${ANSI.reset}`; }
function sep(ch = "─", j = "┼") { return TW.map(w => ch.repeat(w + 2)).join(j); }

export function renderSourceTable(d) {
    const rows = [];
    const bT = d.byType;
    const aL = d.avgLatency || {};

    const addRow = (type, data, latency) => {
        if (!data.count) return;
        let status;
        if (type === "Scripts" && data.bytes > 500 * 1024)  status = `${ANSI.red}[!] HEAVY`;
        else if (type === "API/XHR" && latency > 300)        status = `${ANSI.red}[X] SLOW`;
        else if (type === "Images" && data.bytes > 2e6)      status = `${ANSI.yellow}[~] LARGE`;
        else                                                  status = `${ANSI.green}[✓] OK`;
        rows.push([type, String(data.count), fmt(data.bytes), latency > 0 ? `${latency}ms` : "─", status]);
    };

    addRow("Scripts", bT.script, aL.script);
    addRow("Styles",  bT.css, 0);
    addRow("Images",  bT.img, aL.img);
    addRow("API/XHR", bT.xhr, aL.xhr);
    addRow("Fonts",   bT.font, 0);
    if (bT.media.count) addRow("Media", bT.media, 0);

    if (rows.length === 0) return "";

    const tableW = TW.reduce((s, w) => s + w + 3, 1);
    let o = `  ${ANSI.dim}┌── SOURCE ANALYSIS ${"─".repeat(Math.max(2, tableW - 21))}┐${ANSI.reset}\n`;
    o += `  ${ANSI.dim}│${ANSI.reset} ${cell("TYPE", 0, ANSI.white)} ${ANSI.dim}│${ANSI.reset} ${cell("#", 1, ANSI.white)} ${ANSI.dim}│${ANSI.reset} ${cell("SIZE", 2, ANSI.white)} ${ANSI.dim}│${ANSI.reset} ${cell("LAT", 3, ANSI.white)} ${ANSI.dim}│${ANSI.reset} ${cell("STATUS", 4, ANSI.white)} ${ANSI.dim}│${ANSI.reset}\n`;
    o += `  ${ANSI.dim}├${sep("─", "┼")}┤${ANSI.reset}\n`;
    for (const r of rows) {
        o += `  ${ANSI.dim}│${ANSI.reset} ${cell(r[0], 0, ANSI.cyan)} ${ANSI.dim}│${ANSI.reset} ${cell(r[1], 1)} ${ANSI.dim}│${ANSI.reset} ${cell(r[2], 2)} ${ANSI.dim}│${ANSI.reset} ${cell(r[3], 3)} ${ANSI.dim}│${ANSI.reset} ${r[4]}${ANSI.reset}${" ".repeat(Math.max(0, TW[4] - 9))} ${ANSI.dim}│${ANSI.reset}\n`;
    }
    o += `  ${ANSI.dim}└${sep("─", "┴")}┘${ANSI.reset}\n`;
    return o;
}

// ── TTFB Breakdown Bars ──────────────────────────────────────────────

export function renderTTFBBreakdown(breakdown, barW) {
    if (!breakdown?.phases?.length) return "";
    const maxMs = Math.max(1, ...breakdown.phases.map(p => p.ms));
    let o = "";
    for (const p of breakdown.phases) {
        if (p.ms <= 0) continue;
        const pct = Math.round((p.ms / maxMs) * 100);
        const col = p.ms > p.threshold * 3 ? ANSI.red : p.ms > p.threshold ? ANSI.yellow : ANSI.green;
        const label = p.name.padEnd(12).substring(0, 12);
        o += `    ${ANSI.dim}${label}${ANSI.reset} ${bar(pct, barW, col)} ${col}${p.ms}ms${ANSI.reset}\n`;
    }
    if (breakdown.bottleneck !== "Balanced") {
        o += `    ${ANSI.yellow}⚠ Bottleneck: ${breakdown.bottleneck}${ANSI.reset}\n`;
    }
    return o;
}

// ── Security Score Badge ─────────────────────────────────────────────

export function renderSecurityBadge(sec) {
    const col = sec.score >= 80 ? ANSI.green : sec.score >= 50 ? ANSI.yellow : ANSI.red;
    let o = `    ${ANSI.dim}Score${ANSI.reset} ${col}${ANSI.bold}${sec.score}/100 (${sec.grade})${ANSI.reset}\n`;
    for (const b of sec.breakdown.slice(0, 4)) {
        const ic = b.status === "pass" ? `${ANSI.green}✓` : `${ANSI.red}✗`;
        o += `    ${ic} ${ANSI.dim}${b.check}${ANSI.reset}\n`;
    }
    return o;
}
