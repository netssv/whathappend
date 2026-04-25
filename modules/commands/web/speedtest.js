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
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
            mb = Math.floor(parsed);
        } else {
            return cmdUsage("speedtest", "[size_mb] (1-100)");
        }
    }

    let o = `> curl -o /dev/null http://speedtest.tele2.net/${args.length > 0 ? mb : 10}MB.zip\n`;
    o += `${ANSI.dim}Running local bandwidth test (downloading ${mb}MB payload)...${ANSI.reset}\n\n`;

    const resp = await chrome.runtime.sendMessage({ command: "speedtest", payload: { mb } });
    if (!resp) return o + workerError();
    if (resp.error) return o + cmdError(resp.error);

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
