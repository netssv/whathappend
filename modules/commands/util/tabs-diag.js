import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs-diag — Inject a health-check diagnostic into a live tab
//
//  Detects: broken resources, mixed content, slow assets,
//  DOM bloat, missing meta tags, and page load timing.
// ===================================================================

function ms(val) {
    if (!val || val <= 0) return `${ANSI.dim}N/A${ANSI.reset}`;
    if (val < 500) return `${ANSI.green}${val.toFixed(0)}ms${ANSI.reset}`;
    if (val < 2000) return `${ANSI.yellow}${val.toFixed(0)}ms${ANSI.reset}`;
    return `${ANSI.red}${(val / 1000).toFixed(2)}s${ANSI.reset}`;
}

export async function tabDiag(tabId, label) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url?.startsWith("http")) {
            return `${ANSI.red}[ERROR] Diagnostics require an HTTP/HTTPS page.${ANSI.reset}`;
        }

        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                // ── Timing ──────────────────────────────
                const nav = performance.getEntriesByType("navigation")[0] || {};
                const timing = {
                    ttfb: nav.responseStart ? nav.responseStart - nav.requestStart : 0,
                    domReady: nav.domContentLoadedEventEnd || 0,
                    fullLoad: nav.loadEventEnd || 0,
                    domInteractive: nav.domInteractive || 0,
                };

                // ── Resources ───────────────────────────
                const resources = performance.getEntriesByType("resource");
                const slowThreshold = 3000;
                const slow = [];
                const failed = [];

                for (const r of resources) {
                    if (r.transferSize === 0 && r.decodedBodySize === 0 && r.duration > 0) {
                        failed.push(r.name);
                    }
                    if (r.duration > slowThreshold) {
                        slow.push({ url: r.name, time: r.duration });
                    }
                }

                // ── Broken images ───────────────────────
                const brokenImgs = [];
                for (const img of document.querySelectorAll("img[src]")) {
                    if (img.complete && img.naturalWidth === 0) {
                        brokenImgs.push(img.src);
                    }
                }

                // ── Mixed content ───────────────────────
                const isHTTPS = location.protocol === "https:";
                const mixed = [];
                if (isHTTPS) {
                    const selectors = "img[src^='http:'],script[src^='http:'],link[href^='http:'],iframe[src^='http:']";
                    for (const el of document.querySelectorAll(selectors)) {
                        mixed.push(el.src || el.href);
                    }
                }

                // ── DOM health ──────────────────────────
                const domSize = document.getElementsByTagName("*").length;
                const maxDepth = (() => {
                    let depth = 0;
                    let el = document.body;
                    while (el) {
                        depth++;
                        el = el.querySelector(":scope > *");
                    }
                    return depth;
                })();

                // ── Meta checks ─────────────────────────
                const hasViewport = !!document.querySelector("meta[name='viewport']");
                const hasCharset = !!document.querySelector("meta[charset]")
                    || !!document.querySelector("meta[http-equiv='Content-Type']");
                const hasTitle = !!document.title;
                const hasDescription = !!document.querySelector("meta[name='description']");

                return {
                    timing, slow, failed, brokenImgs, mixed,
                    domSize, maxDepth, resourceCount: resources.length,
                    meta: { hasViewport, hasCharset, hasTitle, hasDescription },
                };
            },
        });

        const d = results?.[0]?.result;
        if (!d) return `${ANSI.red}[ERROR] Script returned no data.${ANSI.reset}`;

        const sep = `${ANSI.dim}${"━".repeat(34)}${ANSI.reset}`;
        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = tab.url; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Diagnostics #${label}${ANSI.reset}`;
        o += ` ${ANSI.dim}${host}${ANSI.reset}\n  ${sep}\n`;

        // Timing
        o += `  ${ANSI.white}TTFB${ANSI.reset}        ${ms(d.timing.ttfb)}\n`;
        o += `  ${ANSI.white}DOM Ready${ANSI.reset}   ${ms(d.timing.domReady)}\n`;
        o += `  ${ANSI.white}Full Load${ANSI.reset}   ${ms(d.timing.fullLoad)}\n`;
        o += `  ${ANSI.white}Resources${ANSI.reset}   ${d.resourceCount}\n`;

        // DOM
        const domColor = d.domSize > 3000 ? ANSI.red : d.domSize > 1500 ? ANSI.yellow : ANSI.green;
        o += `  ${ANSI.white}DOM Nodes${ANSI.reset}   ${domColor}${d.domSize}${ANSI.reset}\n`;

        // Issues
        let issues = 0;

        if (d.brokenImgs.length > 0) {
            issues += d.brokenImgs.length;
            o += `\n  ${ANSI.red}✗ Broken Images (${d.brokenImgs.length})${ANSI.reset}\n`;
            for (const u of d.brokenImgs.slice(0, 3)) {
                const short = u.length > 36 ? "…" + u.slice(-35) : u;
                o += `    ${ANSI.dim}${short}${ANSI.reset}\n`;
            }
        }

        if (d.mixed.length > 0) {
            issues += d.mixed.length;
            o += `\n  ${ANSI.red}✗ Mixed Content (${d.mixed.length})${ANSI.reset}\n`;
            for (const u of d.mixed.slice(0, 3)) {
                const short = u.length > 36 ? "…" + u.slice(-35) : u;
                o += `    ${ANSI.dim}${short}${ANSI.reset}\n`;
            }
        }

        if (d.slow.length > 0) {
            issues += d.slow.length;
            o += `\n  ${ANSI.yellow}⚠ Slow Resources (${d.slow.length})${ANSI.reset}\n`;
            for (const s of d.slow.slice(0, 3)) {
                const short = s.url.length > 28 ? "…" + s.url.slice(-27) : s.url;
                o += `    ${ANSI.dim}${short}${ANSI.reset} ${ms(s.time)}\n`;
            }
        }

        // Meta checks
        const metaIssues = [];
        if (!d.meta.hasViewport) metaIssues.push("viewport");
        if (!d.meta.hasCharset) metaIssues.push("charset");
        if (!d.meta.hasTitle) metaIssues.push("title");
        if (!d.meta.hasDescription) metaIssues.push("description");

        if (metaIssues.length > 0) {
            issues += metaIssues.length;
            o += `\n  ${ANSI.yellow}⚠ Missing Meta${ANSI.reset}\n`;
            o += `    ${ANSI.dim}${metaIssues.join(", ")}${ANSI.reset}\n`;
        }

        if (issues === 0) {
            o += `\n  ${ANSI.green}✓ No issues detected.${ANSI.reset}\n`;
        } else {
            o += `\n  ${ANSI.dim}${issues} issue${issues > 1 ? "s" : ""} found.${ANSI.reset}\n`;
        }

        return o;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
