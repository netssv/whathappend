import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  ftp-check — FTP port 21 probe
// ===================================================================

export async function cmdFTPCheck(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("ftp-check", "<domain>");

    let o = `> ftp-check ${target} (port 21)\n`;

    try {
        const resp = await chrome.runtime.sendMessage({
            command: "port-probe",
            payload: { target, ports: [21] },
        });

        if (!resp) return o + formatError("NO_RESPONSE", "Background worker did not respond.", "Reload the extension.");
        if (resp.error === "Command cancelled.") return `${ANSI.yellow}^C${ANSI.reset}`;

        if (resp.error) {
            return o + formatError(
                "RESTRICTED",
                "Chrome's security sandbox prevents direct FTP probing.",
                `Try external triage:`,
                `https://viewdns.info/portscan/?host=${encodeURIComponent(target)}`
            );
        }

        const result = resp.data?.results?.[0];
        const ins = [];

        if (result && result.open) {
            o += `  ${ANSI.green}✓${ANSI.reset} Port 21 ${ANSI.green}OPEN${ANSI.reset} ${ANSI.dim}(${result.time}ms)${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "FTP transmits in plaintext. Migrate to SFTP (port 22)." });
        } else {
            o += `  ${ANSI.dim}Port 21 closed or filtered${ANSI.reset}\n`;
            ins.push({ level: "PASS", text: "FTP not exposed. Good security posture." });
        }

        ins.push({ level: "INFO", text: `Test FTP: https://viewdns.info/portscan/?host=${encodeURIComponent(target)}` });

        o += `\n${ANSI.dim}Executed: Browser fetch timing heuristic${ANSI.reset}`;
        o += insights(ins);
        return o;
    } catch (err) {
        return o + cmdError(` ${err.message}`);
    }
}
