/**
 * @module modules/commands/web/vitals.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, cmdUsage, cmdError from '../../formatter.js'
 * - Exports: cmdVitals
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, cmdUsage, cmdError } from "../../formatter.js";

// ===================================================================
//  vitals — Core Web Vitals (CWV) Scorecard
//
//  Extracts LCP, CLS, and INP from the active tab using the
//  Performance API. Separate from `load` which shows full timing.
// ===================================================================

export async function cmdVitals(args) {
    let o = `> performance.getEntries() // Core Web Vitals\n`;
    o += `${ANSI.dim}Reading Core Web Vitals from active tab...${ANSI.reset}\n\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "get-web-vitals" });

        if (!resp?.success || !resp.data) {
            const errMsg = resp?.error || "Make sure a website is open in the active tab.";
            return o + cmdError(
                `Could not read Core Web Vitals.${ANSI.reset}\n` +
                `${ANSI.dim}${errMsg}${ANSI.reset}`
            );
        }

        const d = resp.data;
        o += formatVitalsTable(d);
        o += `\n${ANSI.dim}Executed: Performance API (active tab)${ANSI.reset}`;
        o += insights(buildInsights(d));
        return o;

    } catch (err) {
        return o + cmdError(`Vitals read failed: ${err.message}`);
    }
}

// ── Format table ────────────────────────────────────────────────────

function formatVitalsTable(d) {
    let o = `  ${ANSI.white}${ANSI.bold}CORE WEB VITALS${ANSI.reset}\n`;
    o += `  ${ANSI.dim}${"━".repeat(36)}${ANSI.reset}\n`;
    o += fmtVital("LCP", d.lcp, "ms", [2500, 4000]);
    o += fmtVital("CLS", d.cls, "",   [0.1, 0.25]);
    o += fmtVital("INP", d.inp, "ms", [200, 500]);
    return o;
}

function fmtVital(label, value, unit, thresholds) {
    if (value === null || value === undefined || value < 0) {
        return `  ${ANSI.dim}${label.padEnd(6)}${ANSI.reset} ${ANSI.dim}n/a${ANSI.reset}\n`;
    }
    const display = typeof value === "number" && unit !== "ms"
        ? value.toFixed(3) : Math.round(value);
    const color = value <= thresholds[0] ? ANSI.green
               : value <= thresholds[1] ? ANSI.yellow : ANSI.red;
    const grade = value <= thresholds[0] ? "Good"
               : value <= thresholds[1] ? "Needs Improvement" : "Poor";
    return `  ${ANSI.white}${label.padEnd(6)}${ANSI.reset} ${color}${display}${unit}${ANSI.reset} ${ANSI.dim}(${grade})${ANSI.reset}\n`;
}

// ── Insights builder ────────────────────────────────────────────────

function buildInsights(d) {
    const ins = [];

    if (d.lcp !== null && d.lcp >= 0) {
        if (d.lcp <= 2500) ins.push({ level: "PASS", text: `LCP ${Math.round(d.lcp)}ms — good (<2.5s).` });
        else if (d.lcp <= 4000) ins.push({ level: "WARN", text: `LCP ${Math.round(d.lcp)}ms — needs improvement.` });
        else ins.push({ level: "CRIT", text: `LCP ${Math.round(d.lcp)}ms — poor (>4s).` });
    }

    if (d.cls !== null && d.cls >= 0) {
        if (d.cls <= 0.1) ins.push({ level: "PASS", text: `CLS ${d.cls.toFixed(3)} — good (<0.1).` });
        else if (d.cls <= 0.25) ins.push({ level: "WARN", text: `CLS ${d.cls.toFixed(3)} — needs improvement.` });
        else ins.push({ level: "CRIT", text: `CLS ${d.cls.toFixed(3)} — poor (>0.25). Layout shifting detected.` });
    }

    if (d.inp !== null && d.inp >= 0) {
        if (d.inp <= 200) ins.push({ level: "PASS", text: `INP ${Math.round(d.inp)}ms — good (<200ms).` });
        else if (d.inp <= 500) ins.push({ level: "WARN", text: `INP ${Math.round(d.inp)}ms — needs improvement.` });
        else ins.push({ level: "CRIT", text: `INP ${Math.round(d.inp)}ms — poor (>500ms).` });
    }

    ins.push({ level: "INFO", text: "External Check: https://pagespeed.web.dev/" });
    return ins;
}
