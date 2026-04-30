/**
 * @module modules/commands/native/port-scan.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - PORT_SERVICES from '../../data/constants.js'
 * - Exports: cmdPortScan, formatPortResults
 * - Layer: Command Layer (Native) - Native App messaging commands.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { PORT_SERVICES } from "../../data/constants.js";

// ===================================================================
//  port-scan — Native host first, browser fallback
// ===================================================================

export async function cmdPortScan(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("port-scan", "<domain> [ports]");

    const defaultPorts = [21, 22, 80, 443, 3306, 5432, 8080, 8443, 3389, 25];
    const portsArg = args[1]
        ? args[1].split(",").map(p => parseInt(p.trim())).filter(p => p > 0 && p <= 65535)
        : defaultPorts;

    let o = `> nc -z -v -w2 ${target} ${portsArg.slice(0,3).join(" ")}${portsArg.length > 3 ? "..." : ""}\n`;
    o += `${ANSI.dim}Using browser probe (timing heuristics — approximate results)${ANSI.reset}\n\n`;

    try {
        const resp = await chrome.runtime.sendMessage({
            command: "port-probe",
            payload: { target, ports: portsArg },
        });

        if (resp?.error === "Command cancelled.") return `${ANSI.yellow}^C${ANSI.reset}`;

        if (!resp || resp.error) {
            return o + formatError(
                "RESTRICTED",
                resp?.error || "Chrome's security sandbox prevents direct port probing.",
                "Try external triage:",
                `https://viewdns.info/portscan/?host=${encodeURIComponent(target)}`
            );
        }

        return o + formatPortResults(resp.data, target, portsArg, true);
    } catch (err) {
        return o + formatError(
            "RESTRICTED",
            "Chrome's security sandbox prevents direct port probing.",
            "Try external triage:",
            `https://viewdns.info/portscan/?host=${encodeURIComponent(target)}`
        );
    }
}

export function formatPortResults(data, target, ports, isBrowser) {
    let o = "";
    const results = data?.results || [];
    let openCount = 0;
    const openPorts = [];

    for (const r of results) {
        const svc = PORT_SERVICES[r.port] || "unknown";
        if (r.open) {
            openCount++;
            openPorts.push(r.port);
            const hint = r.hint ? ` ${ANSI.dim}(${r.hint})${ANSI.reset}` : "";
            o += `  ${ANSI.green}✓${ANSI.reset} ${String(r.port).padEnd(6)} ${ANSI.cyan}${svc.padEnd(12)}${ANSI.reset} ${ANSI.green}open${ANSI.reset}${hint}  ${ANSI.dim}${r.time}ms${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.red}✗${ANSI.reset} ${String(r.port).padEnd(6)} ${ANSI.dim}${svc.padEnd(12)}${ANSI.reset} ${ANSI.dim}closed${ANSI.reset}  ${ANSI.dim}${r.time}ms${ANSI.reset}\n`;
        }
    }

    o += `\n${ANSI.white}${openCount}/${results.length} ports responding${ANSI.reset}`;
    o += `\n${ANSI.dim}Executed: ${isBrowser ? "Browser fetch timing heuristic" : "nc -zv via native host"}${ANSI.reset}`;

    const ins = [];
    if (isBrowser) {
        ins.push({ level: "WARN", text: "Browser probing is blocked by Chrome for non-HTTP ports (ERR_UNSAFE_PORT)." });
        ins.push({ level: "INFO", text: `External Check: https://viewdns.info/portscan/?host=${encodeURIComponent(target)}` });
    }
    if (openPorts.includes(80) && openPorts.includes(443)) ins.push({ level: "PASS", text: "HTTP + HTTPS both available." });
    if (openPorts.includes(80) && !openPorts.includes(443)) ins.push({ level: "WARN", text: "HTTP open but no HTTPS detected." });
    if (openPorts.includes(3306)) ins.push({ level: "CRIT", text: "MySQL (3306) exposed. Verify firewall." });
    if (openPorts.includes(5432)) ins.push({ level: "CRIT", text: "PostgreSQL (5432) exposed. Verify firewall." });
    if (openPorts.includes(3389)) ins.push({ level: "WARN", text: "RDP (3389) open. High brute-force risk." });
    if (openPorts.includes(21)) ins.push({ level: "WARN", text: "FTP (21) open. Consider SFTP migration." });
    if (openCount === 0) ins.push({ level: "INFO", text: "No ports responding. Host may be firewalled." });

    o += insights(ins);
    return o;
}
