import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError } from "../../formatter.js";

// ===================================================================
//  load — Page Load Performance via browser Performance API
//  Zero-cloud: reads window.performance from active tab
// ===================================================================

export async function cmdLoad(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("load", "<domain>");

    let o = `> curl -w "\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n" -o /dev/null -s https://${domain}\n`;
    o += `${ANSI.dim}Reading Performance API from active tab...${ANSI.reset}\n\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "get-perf-timing" });

        if (!resp?.success || !resp.data) {
            return o + cmdError(
                `Could not read performance data.${ANSI.reset}\n` +
                `${ANSI.dim}Make sure ${domain} is open in the active tab.${ANSI.reset}`
            );
        }

        const d = resp.data;

        // Verify the tab matches the target domain
        if (d.url && !d.url.includes(domain)) {
            return o + cmdError(
                `Active tab is ${d.url}${ANSI.reset}\n` +
                `${ANSI.dim}Open ${domain} in the active tab and try again.${ANSI.reset}`
            );
        }

        // ── Connection Timing ──
        o += `${ANSI.white}${ANSI.bold}  CONNECTION${ANSI.reset}\n`;
        o += fmtMetric("DNS Lookup", d.dns);
        o += fmtMetric("TCP Connect", d.tcp);
        o += fmtMetric("TLS Handshake", d.tls);
        o += fmtMetric("TTFB", d.ttfb);
        o += fmtMetric("Content Download", d.download);

        // ── Rendering Timing ──
        o += `\n${ANSI.white}${ANSI.bold}  RENDERING${ANSI.reset}\n`;
        o += fmtMetric("DOM Interactive", d.domInteractive);
        o += fmtMetric("DOM Complete", d.domComplete);
        o += fmtMetric("Page Load", d.pageLoad);
        if (d.firstPaint > 0) o += fmtMetric("First Paint", d.firstPaint);
        if (d.fcp > 0) o += fmtMetric("First Contentful Paint", d.fcp);
        if (d.lcp > 0) o += fmtMetric("Largest Contentful Paint", d.lcp);

        // ── Resource Summary ──
        if (d.resourceCount > 0) {
            o += `\n${ANSI.white}${ANSI.bold}  RESOURCES${ANSI.reset}\n`;
            o += `  ${ANSI.dim}Total requests:${ANSI.reset}  ${ANSI.white}${d.resourceCount}${ANSI.reset}\n`;
            o += `  ${ANSI.dim}Transfer size:${ANSI.reset}   ${ANSI.white}${formatBytes(d.transferSize)}${ANSI.reset}\n`;
            o += `  ${ANSI.dim}Decoded size:${ANSI.reset}    ${ANSI.white}${formatBytes(d.decodedSize)}${ANSI.reset}\n`;
        }

        o += `\n${ANSI.dim}Executed: Performance API (window.performance)${ANSI.reset}`;

        // ── Insights ──
        const ins = [];

        // TTFB analysis
        if (d.ttfb < 200) ins.push({ level: "PASS", text: `TTFB ${d.ttfb}ms — excellent server response.` });
        else if (d.ttfb < 600) ins.push({ level: "PASS", text: `TTFB ${d.ttfb}ms — acceptable.` });
        else if (d.ttfb < 1500) ins.push({ level: "WARN", text: `TTFB ${d.ttfb}ms — slow server response.` });
        else ins.push({ level: "CRIT", text: `TTFB ${d.ttfb}ms — very slow. Check server/CDN.` });

        // Page load
        if (d.pageLoad < 2000) ins.push({ level: "PASS", text: `Page load ${d.pageLoad}ms — fast.` });
        else if (d.pageLoad < 4000) ins.push({ level: "WARN", text: `Page load ${d.pageLoad}ms — could be faster.` });
        else ins.push({ level: "CRIT", text: `Page load ${d.pageLoad}ms — slow. Users may bounce.` });

        // FCP
        if (d.fcp > 0) {
            if (d.fcp < 1800) ins.push({ level: "PASS", text: `FCP ${d.fcp}ms — good (Google threshold: <1.8s).` });
            else if (d.fcp < 3000) ins.push({ level: "WARN", text: `FCP ${d.fcp}ms — needs improvement (>1.8s).` });
            else ins.push({ level: "CRIT", text: `FCP ${d.fcp}ms — poor (>3s). Critical for SEO.` });
        }

        // LCP
        if (d.lcp > 0) {
            if (d.lcp < 2500) ins.push({ level: "PASS", text: `LCP ${d.lcp}ms — good (Google threshold: <2.5s).` });
            else if (d.lcp < 4000) ins.push({ level: "WARN", text: `LCP ${d.lcp}ms — needs improvement (>2.5s).` });
            else ins.push({ level: "CRIT", text: `LCP ${d.lcp}ms — poor (>4s). Major Core Web Vital issue.` });
        }

        // DNS
        if (d.dns > 100) ins.push({ level: "WARN", text: `DNS ${d.dns}ms — slow resolution. Consider faster DNS.` });

        // TLS
        if (d.tls > 200) ins.push({ level: "WARN", text: `TLS ${d.tls}ms — slow handshake. Check certificate chain.` });

        // Resource count
        if (d.resourceCount > 100) ins.push({ level: "WARN", text: `${d.resourceCount} requests — consider bundling/lazy loading.` });
        if (d.transferSize > 5 * 1024 * 1024) ins.push({ level: "WARN", text: `${formatBytes(d.transferSize)} transferred — heavy page.` });

        ins.push({ level: "INFO", text: `External Check: https://pagespeed.web.dev/analysis?url=https://${domain}` });

        o += insights(ins);
        return o;

    } catch (err) {
        return o + cmdError(`Performance read failed: ${err.message}`);
    }
}

function fmtMetric(label, ms) {
    if (ms === undefined || ms === null || ms < 0) {
        return `  ${ANSI.dim}${label.padEnd(25)}${ANSI.reset} ${ANSI.dim}n/a${ANSI.reset}\n`;
    }
    const color = ms < 100 ? ANSI.green : ms < 500 ? ANSI.yellow : ANSI.red;
    return `  ${ANSI.dim}${label.padEnd(25)}${ANSI.reset} ${color}${ms}ms${ANSI.reset}\n`;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
