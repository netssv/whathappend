/**
 * @module modules/commands/util/tabs-watch-collector.js
 * @description Self-contained DOM injection for tabs-watch. NO imports.
 * Collects: Core Stats, Network/TTFB phases, Web Vitals, Resources,
 * Third-Party URLs, Security. Passive reads only.
 * @connections
 * - Imports: none (injected via chrome.scripting)
 * - Exports: collectTabMetrics
 * - Layer: Command Layer (Util)
 */

/** Injected into page via chrome.scripting.executeScript({ func }). */
export function collectTabMetrics() {
    // ── Memory ───────────────────────────────────────────────────────
    const m = performance.memory || {};

    // ── Navigation timing (TTFB, protocol, full load) ────────────────
    const nav = (performance.getEntriesByType("navigation") || [])[0] || {};
    const ttfb     = nav.responseStart && nav.requestStart
        ? Math.round(nav.responseStart - nav.requestStart) : 0;
    const protocol = nav.nextHopProtocol || "";
    const docSize  = nav.transferSize || nav.encodedBodySize || nav.decodedBodySize || 0;
    const fullLoad = nav.loadEventEnd || 0;
    const navStatus = nav.responseStatus || 200;

    // TTFB Phase Breakdown
    const nk = ["startTime","fetchStart","domainLookupStart","domainLookupEnd","connectStart","connectEnd","secureConnectionStart","requestStart","responseStart","responseEnd","domInteractive","domComplete","loadEventEnd"];
    const navTiming = {}; for (const k of nk) navTiming[k] = nav[k] || (k === "startTime" ? nav.fetchStart || 0 : 0);

    // ── Resources ────────────────────────────────────────────────────
    const res = performance.getEntriesByType("resource");
    let totalBytes = 0;
    const byType = {
        script: { count: 0, bytes: 0 }, css: { count: 0, bytes: 0 }, img: { count: 0, bytes: 0 }, xhr: { count: 0, bytes: 0 },
        font: { count: 0, bytes: 0 }, media: { count: 0, bytes: 0 }, other: { count: 0, bytes: 0 }
    };
    
    let slowestApi = { name: null, dur: 0 };

    // Resource entries for third-party/origin analysis (capped at 200)
    const resourceEntries = [];
    let totalLatency = { script: 0, img: 0, xhr: 0 };
    const failedReqs = [];
    
    for (const r of res) {
        const size = r.transferSize || r.encodedBodySize || r.decodedBodySize || 0;
        totalBytes += size;
        const t = r.initiatorType || "other";
        
        // Collect resource metadata for enrichment engine (capped)
        if (resourceEntries.length < 200) {
            resourceEntries.push({
                name: r.name, type: t, bytes: size,
                duration: Math.round(r.duration),
                transferSize: r.transferSize || 0,
                decodedSize: r.decodedBodySize || 0,
                status: r.responseStatus || 0
            });
        }
        
        const isFailed = (r.transferSize === 0 && r.decodedBodySize === 0 && r.duration > 0) || 
                         (r.responseStatus >= 400);

        if (isFailed) {
            failedReqs.push({ 
                name: r.name, 
                type: t, 
                duration: Math.round(r.duration),
                status: r.responseStatus || 0 
            });
        }
        
        if (t === "script") {
            byType.script.count++; byType.script.bytes += size;
            totalLatency.script += r.duration;
        }
        else if (t === "css" || t === "link" || t === "stylesheet") { byType.css.count++; byType.css.bytes += size; }
        else if (t === "img" || t === "image") {
            byType.img.count++; byType.img.bytes += size;
            totalLatency.img += r.duration;
        }
        else if (t === "xmlhttprequest" || t === "fetch") { 
            byType.xhr.count++; byType.xhr.bytes += size;
            totalLatency.xhr += r.duration;
            if (r.duration > slowestApi.dur) {
                slowestApi.dur = Math.round(r.duration);
                try {
                    let n = new URL(r.name).pathname.split("/").pop();
                    slowestApi.name = n.length > 20 ? n.substring(0, 18) + "…" : n || "api";
                } catch { slowestApi.name = "api"; }
            }
        }
        else if (t === "font") { byType.font.count++; byType.font.bytes += size; }
        else if (t === "video" || t === "audio") { byType.media.count++; byType.media.bytes += size; }
        else { byType.other.count++; byType.other.bytes += size; }
    }

    // Compute average latencies per resource type
    const avgLatency = {
        script: byType.script.count > 0 ? Math.round(totalLatency.script / byType.script.count) : 0,
        img:    byType.img.count > 0    ? Math.round(totalLatency.img / byType.img.count) : 0,
        xhr:    byType.xhr.count > 0    ? Math.round(totalLatency.xhr / byType.xhr.count) : 0,
    };

    // ── Core Web Vitals & Long Tasks (Persistent Observers) ──────────
    if (!window.__wh_cwv) {
        window.__wh_cwv = { lcp: 0, cls: 0, inp: 0, longTasks: 0, maxLongTask: 0, totalBlocking: 0 };
        try {
            new PerformanceObserver(l => {
                const e = l.getEntries();
                if (e.length) window.__wh_cwv.lcp = Math.round(e[e.length - 1].startTime);
            }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch {}
        try {
            new PerformanceObserver(l => {
                for (const e of l.getEntries()) if (!e.hadRecentInput) window.__wh_cwv.cls += e.value;
            }).observe({ type: "layout-shift", buffered: true });
        } catch {}
        try {
            new PerformanceObserver(l => {
                for (const e of l.getEntries()) {
                    const d = e.processingEnd - e.startTime;
                    if (d > window.__wh_cwv.inp) window.__wh_cwv.inp = Math.round(d);
                }
            }).observe({ type: "event", buffered: true });
        } catch {}
        try {
            new PerformanceObserver(l => {
                const entries = l.getEntries();
                window.__wh_cwv.longTasks += entries.length;
                for (const e of entries) {
                    const dur = e.duration;
                    if (dur > window.__wh_cwv.maxLongTask) window.__wh_cwv.maxLongTask = Math.round(dur);
                    window.__wh_cwv.totalBlocking += Math.max(0, dur - 50);
                }
            }).observe({ type: "longtask", buffered: true });
        } catch {}
    }

    const cwv = window.__wh_cwv || { lcp: 0, cls: 0, inp: 0, longTasks: 0, maxLongTask: 0 };
    const { lcp, inp, longTasks, maxLongTask } = cwv;
    const cls = parseFloat(cwv.cls.toFixed(4));
    const totalBlocking = Math.round(cwv.totalBlocking || 0);

    // SRI integrity check on external scripts
    let sriTotal = 0, sriMissing = 0;
    try { for (const s of document.querySelectorAll("script[src]")) { sriTotal++; if (!s.integrity) sriMissing++; } } catch {}

    // Images
    const imgEls = Array.from(document.querySelectorAll("img"));
    const imgLoaded = imgEls.filter(i => i.complete && i.naturalWidth > 0).length;
    const brokenEls = imgEls.filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:"));
    const imgPending = imgEls.filter(i => !i.complete).length;
    const imgExts = {};
    for (const el of imgEls) { if (!el.src || el.src.startsWith("data:")) continue; try { const p = new URL(el.src).pathname; const mx = p.match(/\.([a-z0-9]{2,5})$/i); imgExts[mx ? mx[1].toLowerCase() : "other"] = (imgExts[mx ? mx[1].toLowerCase() : "other"] || 0) + 1; } catch {} }
    const brokenUrls = brokenEls.slice(0, 5).map(el => el.src || "");

    // DOM counts
    const domNodes = document.getElementsByTagName("*").length;
    const scripts = document.querySelectorAll("script[src]").length;
    const iframes = document.querySelectorAll("iframe").length;
    const links = document.querySelectorAll("a[href]").length;
    const videoEls = document.querySelectorAll("video").length;
    const audioEls = document.querySelectorAll("audio").length;
    let mediaPlaying = 0; document.querySelectorAll("video, audio").forEach(el => { if (!el.paused) mediaPlaying++; });

    // Storage & Cookies
    let storageKB = 0, sessionKB = 0;
    try { storageKB = Math.round(JSON.stringify(localStorage).length / 1024); } catch {}
    try { sessionKB = Math.round(JSON.stringify(sessionStorage).length / 1024); } catch {}
    const cookies = document.cookie ? document.cookie.split(";").length : 0;

    // Security Headers (meta-based)
    let hasCSP = false, hasHSTS = false;
    try { for (const m of document.querySelectorAll("meta[http-equiv]")) { const eq = (m.getAttribute("http-equiv") || "").toLowerCase(); if (eq === "content-security-policy") hasCSP = true; if (eq === "strict-transport-security") hasHSTS = true; } } catch {}

    return {
        // Core & Network
        usedHeap: m.usedJSHeapSize || 0, heapLimit: m.jsHeapSizeLimit || 0, domNodes,
        ttfb, protocol, docSize, fullLoad, navStatus, resCount: res.length, netBytes: totalBytes,
        // TTFB Breakdown phases
        navTiming,
        // Web Vitals
        lcp, cls: parseFloat(cls.toFixed(4)), inp,
        // Resources
        byType, longTasks, maxLongTask, totalBlocking, slowestApi, avgLatency,
        // Resource entries for third-party/origin analysis
        resourceEntries, failedReqs,
        // Images
        imgTotal: imgEls.length, imgLoaded, imgBroken: brokenEls.length,
        imgPending, imgExts, brokenUrls,
        // DOM detail
        scripts, iframes, links, videoEls, audioEls, mediaPlaying,
        // Storage & Security
        storageKB, sessionKB, cookies, hasCSP, hasHSTS, sriTotal, sriMissing,
    };
}
