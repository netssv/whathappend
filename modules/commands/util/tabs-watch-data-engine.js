/**
 * @module modules/commands/util/tabs-watch-data-engine.js
 * @description Actionable data processing engine for the live dashboard.
 *
 * Transforms raw collector metrics into enriched, actionable data:
 *   - Security Score (dynamic, CSP/HSTS/cookies/protocol)
 *   - TTFB Breakdown (DNS vs TCP vs TLS vs Server Wait)
 *   - CO2 Impact estimation (Sustainable Web Design model)
 *   - Performance Budget comparison
 *
 * @connections
 * - Imports: TRACKER_DOMAINS, PERF_BUDGET from './tabs-watch-data-lists.js'
 * - Exports: computeSecurityScore, computeTTFBBreakdown, computeCO2Impact,
 *            computeBudgetStatus, computeThirdPartyCost, enrichMetrics
 * - Layer: Command Layer (Util) — pure data transforms, no Chrome API.
 */

import { TRACKER_DOMAINS, PERF_BUDGET } from "./tabs-watch-data-lists.js";

export { TRACKER_DOMAINS, PERF_BUDGET };

// ── Helpers ──────────────────────────────────────────────────────────

function extractApex(host) {
    if (!host) return "";
    const parts = host.replace(/\.$/, "").split(".");
    const cc = ["co.uk","com.br","com.au","co.jp","co.kr","com.mx","org.uk"];
    if (parts.length > 2 && cc.includes(parts.slice(-2).join("."))) {
        return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
}

// ── Third-Party Cost Analysis ────────────────────────────────────────

export function computeThirdPartyCost(resources, pageHost) {
    const apex = extractApex(pageHost);
    let fpBytes = 0, fpCount = 0, tpBytes = 0, tpCount = 0;
    let trackerBytes = 0, trackerCount = 0;

    for (const r of resources) {
        const size = r.bytes || r.transferSize || 0;
        let resHost = "";
        try { resHost = new URL(r.name || r.url || "").hostname; } catch { continue; }
        const resApex = extractApex(resHost);

        if (resApex === apex) { fpBytes += size; fpCount++; continue; }
        tpBytes += size; tpCount++;
        if (TRACKER_DOMAINS.some(td => resHost.includes(td))) {
            trackerBytes += size; trackerCount++;
        }
    }
    const totalBytes = fpBytes + tpBytes;
    return {
        firstParty:  { bytes: fpBytes, count: fpCount },
        thirdParty:  { bytes: tpBytes, count: tpCount },
        trackers:    { bytes: trackerBytes, count: trackerCount },
        trackerPct:  totalBytes > 0 ? Math.round((trackerBytes / totalBytes) * 100) : 0,
        tpPct:       totalBytes > 0 ? Math.round((tpBytes / totalBytes) * 100) : 0,
    };
}

// ── Security Score Engine ────────────────────────────────────────────

export function computeSecurityScore(secData) {
    const breakdown = [];
    const penalties = [];
    let score = 0;

    const chk = (name, ok, pts, max, penalty) => {
        if (ok) { score += pts; breakdown.push({ check: name, pts, max, status: "pass" }); }
        else { breakdown.push({ check: name, pts: 0, max, status: "fail" }); if (penalty) penalties.push(penalty); }
    };

    chk("CSP",     secData.hasCSP,  25, 25, "No CSP → XSS risk");
    chk("HSTS",    secData.hasHSTS, 20, 20, "No HSTS → SSL stripping risk");
    chk("X-Frame", secData.hasXFrame !== false, 10, 10, "No X-Frame-Options → clickjacking");
    chk("X-CTO",   secData.hasXCTO  !== false, 10, 10, "No X-Content-Type-Options → MIME sniffing");

    // Cookie hygiene (20 pts)
    const ck = secData.cookies || 0;
    const ckPts = ck === 0 ? 20 : ck <= 3 ? 18 : ck <= 10 ? 14 : 8;
    score += ckPts;
    breakdown.push({ check: "Cookies", pts: ckPts, max: 20, status: ckPts >= 14 ? "pass" : "warn" });

    // Protocol (15 pts)
    const proto = (secData.protocol || "");
    const isModern = proto.startsWith("h2") || proto.startsWith("h3") || secData.isHTTPS;
    const protoPts = isModern ? 15 : proto === "http/1.1" ? 8 : 0;
    score += protoPts;
    breakdown.push({ check: "HTTPS", pts: protoPts, max: 15, status: protoPts >= 15 ? "pass" : "fail" });

    const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B"
                : score >= 50 ? "C" : score >= 30 ? "D" : "F";
    return { score, grade, breakdown, penalties };
}

// ── TTFB Breakdown ───────────────────────────────────────────────────

export function computeTTFBBreakdown(nav) {
    if (!nav || !nav.requestStart) {
        return { phases: [], bottleneck: "No timing data", totalTTFB: 0 };
    }
    const phases = [];
    const dns = Math.max(0, Math.round((nav.domainLookupEnd || 0) - (nav.domainLookupStart || 0)));
    phases.push({ name: "DNS Lookup", ms: dns, threshold: 50 });

    const tcp = Math.max(0, Math.round((nav.connectEnd || 0) - (nav.connectStart || 0)));
    const tls = nav.secureConnectionStart > 0
        ? Math.max(0, Math.round((nav.connectEnd || 0) - nav.secureConnectionStart)) : 0;
    phases.push({ name: "TCP Connect", ms: Math.max(0, tcp - tls), threshold: 50 });
    if (tls > 0) phases.push({ name: "TLS", ms: tls, threshold: 100 });

    const serverWait = Math.max(0, Math.round((nav.responseStart || 0) - (nav.requestStart || 0)));
    phases.push({ name: "Server Wait", ms: serverWait, threshold: 200 });

    const download = Math.max(0, Math.round((nav.responseEnd || 0) - (nav.responseStart || 0)));
    phases.push({ name: "Download", ms: download, threshold: 100 });

    const slowest = phases.reduce((a, b) => a.ms > b.ms ? a : b, phases[0]);
    const totalTTFB = Math.round((nav.responseStart || 0) - (nav.startTime || nav.fetchStart || 0));
    const bottleneck = slowest.ms > slowest.threshold * 3 ? `${slowest.name} (${slowest.ms}ms)` : "Balanced";

    return { phases, bottleneck, totalTTFB };
}

// ── CO2 Impact ───────────────────────────────────────────────────────

export function computeCO2Impact(totalBytes) {
    const mb = totalBytes / (1024 * 1024);
    const grams = parseFloat((mb * 0.358).toFixed(2));
    const rating = grams < 0.2 ? "clean" : grams < 0.5 ? "moderate" : grams < 1.0 ? "heavy" : "critical";
    return { grams, rating };
}

// ── Performance Budget ───────────────────────────────────────────────

export function computeBudgetStatus(d, budget = PERF_BUDGET) {
    const bT = d.byType || {};
    const results = [];
    const add = (metric, actualBytes, budgetKB) => {
        const actualKB = Math.round(actualBytes / 1024);
        const pct = Math.round((actualKB / budgetKB) * 100);
        const status = pct <= 80 ? "under" : pct <= 100 ? "near" : "over";
        results.push({ metric, actual: actualKB, budget: budgetKB, pct, status, overBy: Math.max(0, actualKB - budgetKB) });
    };
    add("Total",  (d.netBytes || 0) + (d.docSize || 0), budget.totalKB);
    add("JS",     bT.script?.bytes || 0, budget.jsKB);
    add("CSS",    bT.css?.bytes || 0, budget.cssKB);
    add("Images", bT.img?.bytes || 0, budget.imgKB);
    add("Fonts",  bT.font?.bytes || 0, budget.fontKB);
    return results;
}

// ── Master Enrichment ────────────────────────────────────────────────

export function enrichMetrics(d, meta) {
    const resources = d.resourceEntries || [];
    return {
        thirdPartyCost: computeThirdPartyCost(resources, meta.host),
        securityScore:  computeSecurityScore({ hasCSP: d.hasCSP, hasHSTS: d.hasHSTS, cookies: d.cookies, protocol: d.protocol, isHTTPS: (d.protocol || "").startsWith("h") }),
        ttfbBreakdown:  computeTTFBBreakdown(d.navTiming || {}),
        co2:            computeCO2Impact(meta.pageWeight),
        budget:         computeBudgetStatus(d),
    };
}
