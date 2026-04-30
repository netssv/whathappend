/**
 * @module modules/commands/web/speed.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError from '../../formatter.js'
 * - Exports: cmdSpeed
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  speed — Latency Jitter Measurement
//
//  Performs 5 sequential HEAD requests and calculates average
//  latency and standard deviation (jitter).
// ===================================================================

export async function cmdSpeed(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("speed", "<domain>");

    let o = `> ping -c 10 ${domain} | awk '{print $time}'\n`;
    o += `${ANSI.dim}Running 5-round latency test...${ANSI.reset}\n\n`;

    const resp = await chrome.runtime.sendMessage({ command: "speed", payload: { domain } });
    if (!resp) return o + workerError();
    if (resp.error) return o + cmdError(resp.error);

    const { results } = resp.data;
    const okResults = results.filter(r => r.ok);
    const failResults = results.filter(r => !r.ok);

    // ── Per-round output ────────────────────────────────────────────
    for (const r of results) {
        if (r.ok) {
            o += `  ${ANSI.green}#${r.seq}${ANSI.reset} ${ANSI.white}${r.time}ms${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.red}#${r.seq} timeout${ANSI.reset}\n`;
        }
    }

    o += "\n";

    if (okResults.length === 0) {
        o += `${ANSI.red}All 5 requests timed out.${ANSI.reset}`;
        o += insights([{ level: "CRIT", text: "Server unreachable. Check connectivity." }]);
        return o;
    }

    // ── Statistics ───────────────────────────────────────────────────
    const times = okResults.map(r => r.time);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
    const stddev = Math.round(Math.sqrt(variance));
    const min = Math.min(...times);
    const max = Math.max(...times);

    o += `  ${ANSI.dim}────────────────────────${ANSI.reset}\n`;
    o += `  Avg Latency:  ${ANSI.white}${avg}ms${ANSI.reset}\n`;
    o += `  Jitter (σ):   ${ANSI.white}${stddev}ms${ANSI.reset}\n`;
    o += `  Min / Max:    ${ANSI.white}${min}ms / ${max}ms${ANSI.reset}\n`;

    if (failResults.length > 0) {
        o += `  Packet Loss:  ${ANSI.yellow}${failResults.length}/5${ANSI.reset}\n`;
    }

    // ── Insights ────────────────────────────────────────────────────
    const ins = [];

    // Latency
    if (avg < 100) ins.push({ level: "PASS", text: `Fast response (${avg}ms avg).` });
    else if (avg < 300) ins.push({ level: "INFO", text: `Moderate latency (${avg}ms avg).` });
    else if (avg < 800) ins.push({ level: "WARN", text: `High latency (${avg}ms avg). CDN or geo-routing may help.` });
    else ins.push({ level: "CRIT", text: `Very high latency (${avg}ms avg). Check server region.` });

    // Jitter
    if (stddev > 150) ins.push({ level: "CRIT", text: `Severe jitter (σ=${stddev}ms). Connection extremely unstable.` });
    else if (stddev > 50) ins.push({ level: "WARN", text: `Unstable connection (Jitter σ=${stddev}ms). Possible congestion or routing instability.` });
    else ins.push({ level: "PASS", text: `Stable connection (Jitter σ=${stddev}ms).` });

    // Packet loss
    if (failResults.length > 0) {
        ins.push({ level: "WARN", text: `${failResults.length}/5 requests failed. Intermittent connectivity.` });
    }

    ins.push({ level: "INFO", text: `External Check: https://check-host.net/check-ping?host=${domain}` });

    o += insights(ins);
    return o;
}
