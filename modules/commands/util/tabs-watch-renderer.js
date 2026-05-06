/**
 * @module modules/commands/util/tabs-watch-renderer.js
 * @description Semantic three-column dashboard renderer for tabs-watch.
 *
 * Three themed columns with sync-padded phases:
 *   Col 1 "Execution": Health → UX → CPU Stress
 *   Col 2 "Delivery":  Payload → Net Efficiency → Storage
 *   Col 3 "Integrity": Security → Origin Trust → Media
 *
 * Frame hard-capped to R-1 rows. Dynamic column widths.
 *
 * @connections
 * - Imports: ANSI, generateInsights, data-engine, kpi-engine, kpi/renderer-panels
 * - Exports: renderDashboard
 * - Layer: Command Layer (Util) — pure rendering, no Chrome API.
 */

import { ANSI } from "../../formatter.js";
import { generateInsights } from "./tabs-watch-insights.js";
import { computeSecurityScore, computeTTFBBreakdown, computeCO2Impact, computeBudgetStatus } from "./tabs-watch-data-engine.js";
import { renderSourceTable } from "./tabs-watch-renderer-panels.js";
import { computeNetEfficiency, computeOriginTrust, computeExecHealth } from "./tabs-watch-kpi-engine.js";
import { renderNetPanel, renderOriginPanel, renderExecPanel } from "./tabs-watch-kpi-panels.js";

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(b) { if (!b || b <= 0) return "0B"; const u = ["B","KB","MB","GB"]; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return `${b.toFixed(i > 0 ? 1 : 0)}${u[i]}`; }
function bar(pct, w = 12, fc = null) { const c = Math.max(0, Math.min(100, pct)), f = Math.round((c / 100) * w); const col = fc || (c > 85 ? ANSI.red : c > 60 ? ANSI.yellow : ANSI.green); return `${col}${"█".repeat(f)}${ANSI.dim}${"░".repeat(w - f)}${ANSI.reset}`; }
function trunc(s, mx) { return !s ? "" : s.length > mx ? s.slice(0, mx - 1) + "…" : s; }
function cwvC(m, v) { const t = { lcp:[2500,4000], cls:[0.1,0.25], inp:[200,500] }[m]; return !t ? ANSI.white : v <= t[0] ? ANSI.green : v <= t[1] ? ANSI.yellow : ANSI.red; }
function cwvL(m, v) { if (!v || v <= 0) return "Wait"; const t = { lcp:[2500,4000], cls:[0.1,0.25], inp:[200,500] }[m]; return !t ? "" : v <= t[0] ? "Good" : v <= t[1] ? "Fair" : "Poor"; }
function hdr(t, w) { return `  ${ANSI.cyan}${ANSI.bold}${t}${ANSI.reset} ${ANSI.dim}${"─".repeat(Math.max(2, w - t.length - 3))}${ANSI.reset}`; }
function stripA(s) { return s.replace(/\x1b\[[0-9;]*m/g, ""); }
function padA(s, l) { const r = stripA(s).length; return r < l ? s + " ".repeat(l - r) : s; }
function syncCols(...cols) { const mx = Math.max(...cols.map(c => c.length)); for (const c of cols) while (c.length < mx) c.push(""); }

// ── Main Renderer ────────────────────────────────────────────────────

export function renderDashboard(d, meta) {
    const { host, heapPct, pageWeight, uptime, tick, cols, rows } = meta;
    const C = Math.max(30, cols || 50), R = Math.max(15, rows || 24);
    const canThree = C >= (38 * 3 + 4);
    const canTwo   = !canThree && C >= (38 * 2 + 2);
    const multi = canTwo || canThree;
    const colW = canThree ? Math.floor((C - 4) / 3) : canTwo ? Math.floor((C - 2) / 2) : C;
    const isNarrow = C < 50, isShort = R < 25;
    const sepW = multi ? colW - 4 : Math.max(14, Math.min(C - 6, 34));
    const barW = isNarrow ? 8 : Math.max(8, Math.min(14, colW - 24));
    const fullW = C - 4;

    // Enriched data
    const sec = computeSecurityScore({ hasCSP: d.hasCSP, hasHSTS: d.hasHSTS, cookies: d.cookies, protocol: d.protocol, isHTTPS: (d.protocol || "").startsWith("h") });
    const co2 = computeCO2Impact(pageWeight);
    const ttfbBD = computeTTFBBreakdown(d.navTiming || {});
    const budget = computeBudgetStatus(d);
    const enriched = { securityScore: sec, ttfbBreakdown: ttfbBD, co2, budget };
    const netEff = computeNetEfficiency(d.resourceEntries || []);
    const origin = computeOriginTrust(d.resourceEntries || [], meta.host || "", { sriTotal: d.sriTotal, sriMissing: d.sriMissing });
    const execH  = computeExecHealth(d);

    const lines = [], L = [], MC = [], RC = [];
    const add = (ln) => { lines.push(ln); };
    const pulse = ["◆", "◇"][tick % 2];
    const vB = (lbl, k, v, mx, u, rv) => { const p = Math.min(100, (v / mx) * 100); const c = cwvC(k, rv); return `    ${ANSI.dim}${lbl.padEnd(7)}${ANSI.reset} ${bar(p, barW, c)} ${c}${(v > 0 ? `${v}${u}` : "─").padEnd(7)}${ANSI.reset} ${ANSI.dim}(${cwvL(k, rv)})${ANSI.reset}`; };

    // Header
    const statusTag = d.navStatus >= 400 ? `  ${ANSI.red}[HTTP ${d.navStatus}]${ANSI.reset}` : "";
    add(`  ${ANSI.cyan}${ANSI.bold}${pulse} WATCH${ANSI.reset}  ${ANSI.white}${trunc(host, C - 25)}${ANSI.reset}  ${ANSI.dim}${uptime}${ANSI.reset}${statusTag}`);
    add(`  ${ANSI.dim}${"═".repeat(fullW)}${ANSI.reset}`);

    // ═══ PHASE 1: Health & Speed │ Payload │ Security Score ══════════
    L.push(hdr("Health & Speed", sepW));
    L.push(`    ${ANSI.dim}${(isNarrow ? "Mem " : "Memory").padEnd(6)}${ANSI.reset} ${bar(heapPct, barW)} ${ANSI.white}${heapPct.toFixed(1)}%${ANSI.reset}`);
    const domCol = d.domNodes > 3000 ? ANSI.red : d.domNodes > 1500 ? ANSI.yellow : ANSI.green;
    L.push(`    ${ANSI.dim}DOM${ANSI.reset}    ${bar(Math.min(100, d.domNodes / 3000 * 100), barW, domCol)} ${domCol}${d.domNodes}${ANSI.reset}`);
    let srv = `    ${ANSI.dim}TTFB${ANSI.reset}   ${(d.ttfb > 1800 ? ANSI.red : d.ttfb > 800 ? ANSI.yellow : ANSI.green)}${ANSI.bold}${d.ttfb}${ANSI.reset}${ANSI.dim}ms${ANSI.reset}`;
    if (d.protocol) srv += ` ${ANSI.dim}│${ANSI.reset} ${ANSI.white}${d.protocol.toUpperCase()}${ANSI.reset}`;
    L.push(srv);

    if (multi) {
        const wC = pageWeight > 5e6 ? ANSI.red : pageWeight > 2e6 ? ANSI.yellow : ANSI.green;
        MC.push(hdr(`Payload ${wC}${fmt(pageWeight)}${ANSI.reset}${ANSI.dim} / ${d.resCount} req`, sepW));
        const pB = (l, b, c, col) => { if (!c) return; MC.push(`    ${ANSI.dim}${l.padEnd(7)}${ANSI.reset} ${bar(b > 0 ? Math.min(100, b / Math.max(1, pageWeight) * 100) : 0, barW, col)} ${ANSI.white}${fmt(b)}${ANSI.reset}`); };
        pB("JS", d.byType.script.bytes, d.byType.script.count, ANSI.yellow);
        pB("CSS", d.byType.css.bytes, d.byType.css.count, ANSI.magenta);
        pB("Img", d.byType.img.bytes, d.byType.img.count, ANSI.blue);
        pB("API", d.byType.xhr.bytes, d.byType.xhr.count, ANSI.green);
        if (d.longTasks > 0) { const ltC = d.longTasks > 30 ? ANSI.red : d.longTasks > 15 ? ANSI.yellow : ANSI.cyan; MC.push(`    ${ANSI.dim}Blocks${ANSI.reset}  ${ltC}▲ ${d.longTasks} heavy (>50ms)${ANSI.reset}`); }
    }
    if (canThree) {
        RC.push(hdr("Security Score", sepW));
        const sC = sec.score >= 80 ? ANSI.green : sec.score >= 50 ? ANSI.yellow : ANSI.red;
        RC.push(`    ${ANSI.dim}Score${ANSI.reset} ${sC}${ANSI.bold}${sec.score}/100 (${sec.grade})${ANSI.reset}`);
        for (const b of sec.breakdown.slice(0, 4)) RC.push(`    ${b.status === "pass" ? `${ANSI.green}✓` : `${ANSI.red}✗`} ${ANSI.dim}${b.check}${ANSI.reset}`);
    }
    if (canThree) syncCols(L, MC, RC); else if (canTwo) syncCols(L, MC);

    // ═══ PHASE 2: User Experience │ Net Efficiency │ Origin & Trust ══
    L.push(hdr("User Experience", sepW));
    L.push(vB("Load", "lcp", d.lcp > 0 ? (d.lcp / 1000).toFixed(2) : 0, 5.0, "s", d.lcp));
    L.push(vB("Visual", "cls", d.cls.toFixed(3), 0.5, "", d.cls));
    L.push(vB("Click", "inp", d.inp, 800, "ms", d.inp));

    if (multi) for (const ln of renderNetPanel(netEff, sepW)) MC.push(ln);
    if (canThree) for (const ln of renderOriginPanel(origin, sepW)) RC.push(ln);
    if (canThree) syncCols(L, MC, RC); else if (canTwo) syncCols(L, MC);

    // ═══ PHASE 3: CPU Stress │ Storage │ Media & Assets ══════════════
    if (multi) for (const ln of renderExecPanel(execH, sepW)) L.push(ln);

    if (multi) {
        if (canTwo) for (const ln of renderOriginPanel(origin, sepW)) MC.push(ln);
        MC.push(hdr("Storage", sepW));
        MC.push(`    ${ANSI.dim}Cookies${ANSI.reset} ${ANSI.white}${d.cookies}${ANSI.reset} ${ANSI.dim}│ Local${ANSI.reset} ${d.storageKB}KB`);
    }
    if (canThree) {
        RC.push(hdr("Media & Assets", sepW));
        RC.push(`    ${ANSI.dim}Images${ANSI.reset} ${d.imgBroken > 0 ? ANSI.red : ANSI.white}${d.imgLoaded}${ANSI.reset} ${ANSI.dim}loaded${ANSI.reset}`);
        if (d.imgBroken > 0) RC.push(`    ${ANSI.dim}Broken${ANSI.reset} ${ANSI.red}${d.imgBroken}${ANSI.reset}`);
        const types = Object.entries(d.imgExts).map(([k,v]) => `${k}:${v}`).join(" ");
        if (types) RC.push(`    ${ANSI.dim}Formats${ANSI.reset} ${trunc(types, sepW - 12)}`);
    }
    if (canThree) syncCols(L, MC, RC); else if (canTwo) syncCols(L, MC);

    // Narrow fallback: single-column payload
    if (!multi) {
        const wC = pageWeight > 5e6 ? ANSI.red : pageWeight > 2e6 ? ANSI.yellow : ANSI.green;
        L.push(hdr(`Payload ${wC}${fmt(pageWeight)}${ANSI.reset}${ANSI.dim} / ${d.resCount} req`, sepW));
        const pB = (l, b, c, col) => { if (!c) return; L.push(`    ${ANSI.dim}${l.padEnd(7)}${ANSI.reset} ${bar(b > 0 ? Math.min(100, b / Math.max(1, pageWeight) * 100) : 0, barW, col)} ${ANSI.white}${fmt(b)}${ANSI.reset}`); };
        pB("JS", d.byType.script.bytes, d.byType.script.count, ANSI.yellow);
        pB("CSS", d.byType.css.bytes, d.byType.css.count, ANSI.magenta);
        pB("Img", d.byType.img.bytes, d.byType.img.count, ANSI.blue);
        pB("API", d.byType.xhr.bytes, d.byType.xhr.count, ANSI.green);
        L.push(hdr("Storage", sepW));
        L.push(`    ${ANSI.dim}Cookies${ANSI.reset} ${ANSI.white}${d.cookies}${ANSI.reset} ${ANSI.dim}│ Local${ANSI.reset} ${d.storageKB}KB`);
    }

    // ── Zip columns ──────────────────────────────────────────────────
    if (canThree) { for (let i = 0; i < Math.max(L.length, MC.length, RC.length); i++) add(`${padA(L[i]||"",colW)} ${padA(MC[i]||"",colW)} ${RC[i]||""}`); }
    else if (canTwo) { for (let i = 0; i < Math.max(L.length, MC.length); i++) add(`${padA(L[i]||"",colW)} ${MC[i]||""}`); }
    else { for (const line of L) add(line); }

    // Source Analysis Table
    if (multi && !isShort) { const tbl = renderSourceTable(d); if (tbl) for (const tl of tbl.split("\n")) { if (tl) add(tl); } }

    // Failed Requests Panel
    if (d.failedReqs && d.failedReqs.length > 0 && !isShort) {
        add(`  ${ANSI.red}${ANSI.bold}✗ FAILED REQUESTS (${d.failedReqs.length})${ANSI.reset}`);
        for (const f of d.failedReqs.slice(0, 3)) {
            const statusTxt = f.status >= 400 ? `[HTTP ${f.status}] ` : "";
            const short = f.name.length > fullW - 15 ? "…" + f.name.slice(-(fullW - 16)) : f.name;
            add(`    ${ANSI.red}${statusTxt}${short}${ANSI.reset}`);
        }
    }

    // ── Insights ─────────────────────────────────────────────────────
    add(hdr("Insights", fullW));
    const raw = generateInsights(d, meta, enriched);
    const lpp = multi ? 2 : 1, iBudget = Math.max(1, R - lines.length - 3);
    const iMax = Math.max(1, Math.floor(iBudget / lpp));
    for (const item of raw.slice(0, iMax)) {
        const col = item.level === "CRIT" ? ANSI.red : item.level === "WARN" ? ANSI.yellow : ANSI.green;
        add(`    ${col}${item.icon} [${item.level}]${ANSI.reset} ${trunc(item.msg, Math.max(10, C - 15))}`);
        if (item.action && multi) add(`    ${ANSI.dim}  → ${trunc(item.action, Math.max(10, C - 14))}${ANSI.reset}`);
    }
    if (raw.length > iMax) add(`    ${ANSI.dim}… +${raw.length - iMax} hidden (make terminal taller)${ANSI.reset}`);

    if (!isShort) add(`  ${ANSI.dim}${"─".repeat(fullW)}${ANSI.reset}`);
    add(`  ${ANSI.dim}● poll 2s │ Ctrl+C to exit${multi ? "" : " │ Widen for details"}${ANSI.reset}`);
    return lines.slice(0, Math.max(5, R - 1)).join("\n") + "\n";
}
