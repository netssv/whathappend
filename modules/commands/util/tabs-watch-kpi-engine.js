/**
 * @module modules/commands/util/tabs-watch-kpi-engine.js
 * @description Actionable KPI computation engine for the watch dashboard.
 *
 * Three KPI modules:
 *   1. Network Efficiency — compression ratio, potential savings
 *   2. Origin & Trust    — 1st/3rd party split, SRI integrity
 *   3. Execution Health  — CPU stress, main thread blocking cost
 *
 * All functions are MV3-compatible (pure computation, no Chrome API).
 *
 * @connections
 * - Imports: TRACKER_DOMAINS from './tabs-watch-data-lists.js'
 * - Exports: computeNetEfficiency, computeOriginTrust, computeExecHealth
 * - Layer: Command Layer (Util) — pure data transforms.
 */

import { TRACKER_DOMAINS } from "./tabs-watch-data-lists.js";

// ── Helpers ──────────────────────────────────────────────────────────

function extractApex(host) {
    if (!host) return "";
    const p = host.replace(/\.$/, "").split(".");
    const cc = ["co.uk","com.br","com.au","co.jp","co.kr","com.mx","org.uk"];
    if (p.length > 2 && cc.includes(p.slice(-2).join("."))) return p.slice(-3).join(".");
    return p.slice(-2).join(".");
}

// ── 1. Network Efficiency ────────────────────────────────────────────

/**
 * Compression ratio analysis across all resources.
 * Compares transferSize vs decodedBodySize to detect Brotli/Gzip usage.
 *
 * @param {Array} resources - resourceEntries from collector
 * @returns {{ ratio, pct, compressed, uncompressed, savingsBytes, savingsStr, grade }}
 */
export function computeNetEfficiency(resources) {
    let totalTransfer = 0, totalDecoded = 0;
    let compressed = 0, uncompressed = 0, zeroed = 0;

    for (const r of resources) {
        const ts = r.transferSize || 0;
        const ds = r.decodedSize || 0;
        if (ts === 0 && ds === 0) { zeroed++; continue; }
        totalTransfer += ts;
        totalDecoded += ds;

        // If transferSize < decodedSize by >10%, likely compressed
        if (ds > 0 && ts > 0 && ts < ds * 0.9) {
            compressed++;
        } else if (ts > 0) {
            uncompressed++;
        }
    }

    const ratio = totalDecoded > 0 ? totalTransfer / totalDecoded : 1;
    const pct = Math.round((1 - ratio) * 100);
    // Potential savings if uncompressed resources used Brotli (~70% ratio)
    const potentialSavings = Math.round(
        resources.reduce((sum, r) => {
            const ts = r.transferSize || 0;
            const ds = r.decodedSize || 0;
            if (ds > 0 && ts >= ds * 0.9 && ts > 1024) {
                return sum + (ts - Math.round(ds * 0.3));
            }
            return sum;
        }, 0)
    );

    const grade = pct >= 60 ? "excellent" : pct >= 30 ? "good" : pct > 0 ? "fair" : "none";

    return {
        ratio: ratio.toFixed(2),
        pct: Math.max(0, pct),
        compressed, uncompressed, zeroed,
        savingsBytes: potentialSavings,
        savingsStr: potentialSavings > 1048576
            ? `${(potentialSavings / 1048576).toFixed(1)}MB`
            : `${Math.round(potentialSavings / 1024)}KB`,
        grade,
    };
}

// ── 2. Origin & Trust ────────────────────────────────────────────────

/**
 * Classify resources by origin (1st party / 3rd party / tracker)
 * and check SRI (Subresource Integrity) coverage.
 *
 * @param {Array} resources - resourceEntries from collector
 * @param {string} pageHost - the page's hostname
 * @param {object} sri - { sriTotal, sriMissing }
 * @returns {{ fp, tp, trackerCount, fpPct, tpPct, sriCoverage, sriRisk, topThirdParty }}
 */
export function computeOriginTrust(resources, pageHost, sri = {}) {
    const apex = extractApex(pageHost);
    let fp = 0, tp = 0, trackerCount = 0;
    const tpDomains = {};

    for (const r of resources) {
        let host = "";
        try { host = new URL(r.name || "").hostname; } catch { continue; }
        const resApex = extractApex(host);

        if (resApex === apex) { fp++; continue; }
        tp++;
        tpDomains[resApex] = (tpDomains[resApex] || 0) + 1;
        if (TRACKER_DOMAINS.some(td => host.includes(td))) trackerCount++;
    }

    const total = fp + tp;
    const fpPct = total > 0 ? Math.round((fp / total) * 100) : 100;
    const tpPct = total > 0 ? Math.round((tp / total) * 100) : 0;

    // Top 3 third-party domains by request count
    const topThirdParty = Object.entries(tpDomains)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([d, c]) => ({ domain: d, count: c }));

    // SRI analysis
    const sriTotal = sri.sriTotal || 0;
    const sriMissing = sri.sriMissing || 0;
    const sriCoverage = sriTotal > 0 ? Math.round(((sriTotal - sriMissing) / sriTotal) * 100) : 0;
    const sriRisk = sriMissing > 3 ? "high" : sriMissing > 0 ? "medium" : "none";

    return { fp, tp, trackerCount, fpPct, tpPct, sriCoverage, sriMissing, sriRisk, topThirdParty };
}

// ── 3. Execution Health ──────────────────────────────────────────────

/**
 * CPU stress and main thread health analysis.
 * Translates long task data into actionable execution cost metrics.
 *
 * @param {object} d - raw metrics with longTasks, maxLongTask, totalBlocking, lcp
 * @returns {{ stress, stressLabel, stressPct, tbt, junkBlocks, execCost, execLabel }}
 */
export function computeExecHealth(d) {
    const longTasks = d.longTasks || 0;
    const maxBlock = d.maxLongTask || 0;
    const tbt = d.totalBlocking || 0;

    // CPU Stress: based on total blocking time + frequency
    // TBT thresholds: <200ms=low, <600ms=medium, <1000ms=high, >1000ms=critical
    const stressPct = Math.min(100, Math.round((tbt / 1500) * 100));
    let stress, stressLabel;
    if (tbt < 200) { stress = "low"; stressLabel = "Smooth"; }
    else if (tbt < 600) { stress = "medium"; stressLabel = "Moderate"; }
    else if (tbt < 1000) { stress = "high"; stressLabel = "Stressed"; }
    else { stress = "critical"; stressLabel = "Overloaded"; }

    // Junk blocks: long tasks > 250ms (severe main thread lockups)
    const junkBlocks = maxBlock > 500 ? "Critical" : maxBlock > 250 ? "Warning" : "Clean";

    // Execution Cost: how much of LCP time is spent on JS processing
    const lcpMs = d.lcp || 0;
    const execCostPct = lcpMs > 0 && tbt > 0 ? Math.min(100, Math.round((tbt / lcpMs) * 100)) : 0;
    const execLabel = execCostPct > 50 ? "JS-bound" : execCostPct > 20 ? "Mixed" : "Network-bound";

    return { stress, stressLabel, stressPct, tbt, junkBlocks, execCost: execCostPct, execLabel };
}
