import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  isup — Network Parity Check (Local vs Global)
//
//  Compares local reachability against a public uptime API to
//  detect local blocks, ISP routing issues, or global outages.
// ===================================================================

export async function cmdIsUp(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("isup", "<domain>");

    let o = `> curl -I -s https://${domain} | head -n 1\n`;
    o += `${ANSI.dim}Checking network parity...${ANSI.reset}\n\n`;

    // Fire both checks in parallel
    const [localResp, globalResp] = await Promise.all([
        chrome.runtime.sendMessage({ command: "isup-local", payload: { domain } }),
        chrome.runtime.sendMessage({ command: "isup-global", payload: { domain } }),
    ]);

    if (!localResp) return o + workerError();

    // ── Local Access ────────────────────────────────────────────────
    const localOk = localResp.success && localResp.data?.reachable;
    const localTime = localResp.data?.timeMs;
    const localLabel = localOk
        ? `${ANSI.green}[ONLINE]${ANSI.reset} ${ANSI.dim}(${localTime}ms)${ANSI.reset}`
        : `${ANSI.red}[FAIL]${ANSI.reset}`;
    o += `  Local Access:  ${localLabel}\n`;

    // ── Global Access ───────────────────────────────────────────────
    let globalOk = null;
    if (globalResp?.success) {
        globalOk = !globalResp.data.isDown;
        const gLabel = globalOk
            ? `${ANSI.green}[ONLINE]${ANSI.reset}`
            : `${ANSI.red}[DOWN]${ANSI.reset}`;
        o += `  Global Access: ${gLabel}`;
        if (globalResp.data.responseCode) {
            o += ` ${ANSI.dim}(HTTP ${globalResp.data.responseCode})${ANSI.reset}`;
        }
        o += "\n";
    } else {
        o += `  Global Access: ${ANSI.yellow}[API N/A]${ANSI.reset} ${ANSI.dim}External check unavailable${ANSI.reset}\n`;
    }

    // ── Insights ────────────────────────────────────────────────────
    const ins = [];

    if (localOk && globalOk === true) {
        ins.push({ level: "PASS", text: "Site is reachable locally and globally." });
    } else if (localOk && globalOk === false) {
        ins.push({ level: "WARN", text: "Reachable locally but reported DOWN globally. Possible CDN edge-cache serving stale content." });
    } else if (!localOk && globalOk === true) {
        ins.push({ level: "CRIT", text: "Potential local block or ISP routing issue detected." });
        ins.push({ level: "INFO", text: "The site is globally reachable but your network cannot connect." });
        ins.push({ level: "INFO", text: "Try: DNS flush, VPN, or check firewall rules." });
    } else if (!localOk && globalOk === false) {
        ins.push({ level: "CRIT", text: "Site appears DOWN both locally and globally." });
        ins.push({ level: "INFO", text: "The server may be offline or the domain has expired." });
    } else if (!localOk && globalOk === null) {
        ins.push({ level: "WARN", text: "Local access failed. Global status unknown (API unavailable)." });
    } else {
        ins.push({ level: "PASS", text: "Local access confirmed." });
    }

    ins.push({ level: "INFO", text: `External Check: https://isup.me/${domain}` });

    o += insights(ins);
    return o;
}
