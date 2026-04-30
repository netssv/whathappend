/**
 * @module modules/commands/web/speedtest.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, cmdError, workerError, cmdUsage from '../../formatter.js'
 * - Exports: cmdSpeedtest
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, cmdError, workerError, cmdUsage } from "../../formatter.js";

// ===================================================================
//  speedtest — Local bandwidth test
//
//  Downloads a 10MB payload from Cloudflare's speed API to measure
//  the user's local internet download speed.
// ===================================================================

export async function cmdSpeedtest(args) {
    let mb = 10;
    if (args.length > 0) {
        const parsed = parseInt(args[0], 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
            mb = Math.floor(parsed);
        } else {
            return cmdUsage("speedtest", "[size_mb] (1-90)");
        }
    }

    let o = `> curl -o /dev/null https://speed.cloudflare.com/__down?bytes=${mb * 1024 * 1024}\n`;
    o += `${ANSI.dim}Running local bandwidth test (downloading ${mb}MB payload)...${ANSI.reset}\n\n`;

    const resp = await chrome.runtime.sendMessage({ command: "speedtest", payload: { mb } });
    if (!resp) return o + workerError();
    if (resp.error) {
        if (resp.error.includes("403")) {
            return o + `  ${ANSI.yellow}[NOTICE] Resource Limit: The test server is rate-limiting large requests (403). Try a smaller size (e.g. speedtest 10).${ANSI.reset}\n`;
        }
        return o + `  ${ANSI.red}[ERROR] ITIL Incident: ${resp.error}${ANSI.reset}\n`;
    }

    const { mbps, durationMs, location, ip } = resp.data;

    o += `  ${ANSI.dim}────────────────────────${ANSI.reset}\n`;
    o += `  Download Speed:  ${ANSI.green}${mbps} Mbps${ANSI.reset}\n`;
    o += `  Test Duration:   ${ANSI.white}${durationMs}ms${ANSI.reset}\n`;
    
    if (location !== "Unknown, Unknown (Unknown)") {
        o += `  Edge Location:   ${ANSI.dim}${location}${ANSI.reset}\n`;
    }

    const ins = [];
    if (mbps > 100) ins.push({ level: "PASS", text: "Excellent bandwidth. Suitable for 4K streaming and large downloads." });
    else if (mbps > 25) ins.push({ level: "INFO", text: "Good bandwidth. Suitable for HD streaming." });
    else if (mbps > 5) ins.push({ level: "WARN", text: "Moderate bandwidth. May experience buffering with large assets." });
    else ins.push({ level: "CRIT", text: "Very slow connection. Expect long page load times." });

    ins.push({ level: "INFO", text: `External Check: https://fast.com` });

    o += insights(ins);
    return o;
}
