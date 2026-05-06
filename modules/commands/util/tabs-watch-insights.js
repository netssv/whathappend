/**
 * @module modules/commands/util/tabs-watch-insights.js
 * @description Actionable insights engine for the live dashboard.
 *              Generates thermal-zone insights with "Next Step" actions.
 *
 * Zones: 🔴 CRIT (threats) | 🟡 WARN (efficiency) | 🟢 PASS (clear)
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: generateInsights, renderInsightsPanel
 * - Layer: Command Layer (Util) — pure computation, no Chrome API.
 */

import { ANSI } from "../../formatter.js";

const T = {
    domWarn: 1500, domCrit: 3000,
    lcpGood: 2500, lcpPoor: 4000,
    clsGood: 0.1,  clsPoor: 0.25,
    inpGood: 200,  inpPoor: 500,
    ttfbGood: 800, ttfbPoor: 1800,
    heapWarnPct: 70, heapCritPct: 90,
    longTaskWarn: 15, longTaskCrit: 30,
    jsBytesWarn: 500 * 1024, totalWarn: 5 * 1024 * 1024,
};

// ── Insight Builder ──────────────────────────────────────────────────

function h(level, msg, action) { return { level, icon: level === "WARN" || level === "CRIT" ? "●" : "●", msg, action }; }
function sec(msg, action) { return { level: "WARN", icon: "▲", msg, action }; }

/**
 * @param {object} d - raw metrics
 * @param {object} meta - { heapPct, pageWeight }
 * @param {object} [enriched] - from data engine (optional)
 */
export function generateInsights(d, meta, enriched = null) {
    const hints = [];

    // ── RED ZONE ─────────────────────────────────────────────────────
    if (d.domNodes > T.domCrit) hints.push(h("CRIT", `DOM: ${d.domNodes.toLocaleString()} → Heavy DOM causes slow rendering.`, "Refactor: Virtualize lists, remove deep nesting"));
    else if (d.domNodes > T.domWarn) hints.push(h("WARN", `DOM: ${d.domNodes.toLocaleString()}. Keep under 1,500 for snappy UX.`, "Audit: Lazy-load off-screen sections"));

    if (d.longTasks > T.longTaskCrit) hints.push(h("CRIT", `${d.longTasks} heavy scripts (>50ms). Main thread critically blocked.`, "Split: Code-split large bundles, defer non-critical JS"));
    else if (d.longTasks > T.longTaskWarn) hints.push(h("WARN", `${d.longTasks} blocking scripts. JS might delay interactions.`, "Defer: Move analytics to requestIdleCallback"));

    if (d.lcp > T.lcpPoor) hints.push(h("CRIT", `LCP ${(d.lcp / 1000).toFixed(1)}s — Content too slow.`, 'Preload: Add <link rel="preload"> for hero image'));
    else if (d.lcp > T.lcpGood) hints.push(h("WARN", `LCP ${(d.lcp / 1000).toFixed(1)}s — Optimize largest element.`, "Compress: Use WebP/AVIF for hero images"));

    if (d.inp > T.inpPoor) hints.push(h("CRIT", `INP ${d.inp}ms — Site unresponsive to clicks.`, "Debounce: Break event handlers, yield to main thread"));
    else if (d.inp > T.inpGood) hints.push(h("WARN", `INP ${d.inp}ms — Interaction slightly delayed.`, "Profile: Check heavy onClick/onScroll handlers"));

    if (d.cls > T.clsPoor) hints.push(h("CRIT", `CLS ${d.cls.toFixed(3)} — High visual instability.`, "Fix: Set width/height on img/video, reserve ad space"));
    else if (d.cls > T.clsGood) hints.push(h("WARN", `CLS ${d.cls.toFixed(3)} — Minor visual shifts.`, "Set: Fixed dimensions for images and ads"));

    if (d.ttfb > T.ttfbPoor) {
        const why = enriched?.ttfbBreakdown?.bottleneck || "server processing";
        hints.push(h("CRIT", `TTFB ${d.ttfb}ms — Bottleneck: ${why}.`, "Check: Server/CDN config, database queries"));
    } else if (d.ttfb > T.ttfbGood) hints.push(h("WARN", `TTFB ${d.ttfb}ms — Server response elevated.`, "CDN: Deploy edge caching or upgrade hosting"));

    if (meta.heapPct > T.heapCritPct) hints.push(h("CRIT", `Memory ${meta.heapPct.toFixed(0)}% — Near crash.`, "Leak: Profile with DevTools Memory tab"));
    else if (meta.heapPct > T.heapWarnPct) hints.push(h("WARN", `Memory ${meta.heapPct.toFixed(0)}% — Watch for leaks.`, "Audit: Detached DOM nodes and closures"));

    if (d.navStatus >= 400) {
        hints.push(h("CRIT", `HTTP ${d.navStatus} Error on main document.`, "Server: Check backend logs and routing."));
    }

    if (d.failedReqs && d.failedReqs.length > 0) {
        hints.push(h("CRIT", `${d.failedReqs.length} resource(s) failed or returned HTTP errors.`, "Network: Check CORS, missing files, or blocked APIs"));
    }

    // ── YELLOW ZONE ──────────────────────────────────────────────────
    if (d.byType.script.bytes > T.jsBytesWarn) hints.push(h("WARN", `JS: ${Math.round(d.byType.script.bytes / 1024)}KB loaded.`, "Tree-shake: Remove unused exports, split vendor"));

    if (meta.pageWeight > T.totalWarn) hints.push(h("WARN", `Page: ${(meta.pageWeight / 1048576).toFixed(1)}MB — Heavy for mobile.`, "Compress: Enable Brotli, lazy-load resources"));

    if (!d.hasCSP) hints.push(sec("Missing CSP → XSS vulnerability.", "Deploy: Content-Security-Policy header"));
    if (!d.hasHSTS) hints.push(sec("Missing HSTS → SSL stripping risk.", "Add: Strict-Transport-Security max-age=31536000"));

    // ── Enriched insights ────────────────────────────────────────────
    if (enriched?.thirdPartyCost?.trackerPct > 20) hints.push(sec(`Trackers: ${enriched.thirdPartyCost.trackerPct}% of payload.`, "Consolidate via GTM, remove unused pixels"));
    if (enriched?.co2?.rating === "heavy" || enriched?.co2?.rating === "critical") hints.push(h("WARN", `CO2: ${enriched.co2.grams}g per load.`, "Green: Optimize images, enable caching"));
    if (enriched?.budget) {
        const over = enriched.budget.filter(b => b.status === "over");
        if (over.length) { const w = over.sort((a, b) => b.pct - a.pct)[0]; hints.push(h("WARN", `Budget: ${w.metric} at ${w.pct}% (${w.overBy}KB over).`, `Reduce: Target ${w.budget}KB for ${w.metric}`)); }
    }

    // ── GREEN ZONE ───────────────────────────────────────────────────
    if (hints.length === 0) hints.push({ level: "PASS", icon: "●", msg: "Excellent! Fast, light, and secure." });
    return hints;
}

/**
 * Render insights as ANSI text.
 * @param {Array} insights
 * @param {number} maxItems
 */
export function renderInsightsPanel(insights, maxItems = 4) {
    let out = "";
    for (const item of insights.slice(0, maxItems)) {
        const color = item.level === "CRIT" ? ANSI.red : item.level === "WARN" ? ANSI.yellow : ANSI.green;
        out += `    ${color}${item.icon} [${item.level}]${ANSI.reset} ${item.msg}\n`;
    }
    if (insights.length > maxItems) out += `    ${ANSI.dim}… +${insights.length - maxItems} more${ANSI.reset}\n`;
    return out;
}
