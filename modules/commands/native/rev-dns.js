/**
 * @module modules/commands/native/rev-dns.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - resolveProvider from '../../utils.js'
 * - Exports: cmdRevDNS
 * - Layer: Command Layer (Native) - Native App messaging commands.
 */

import {ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  rev-dns — Reverse DNS via Google DoH (PTR record)
// ===================================================================

export async function cmdRevDNS(args) {
    const info = {};
    const ip = resolveTargetDomain(args[0], info);
    if (!ip) return cmdUsage("rev-dns", "<ip>");

    if (!isIPAddress(ip)) {
        return cmdError(` rev-dns requires an IP address, not a domain.${ANSI.reset}\n${ANSI.dim}Use ${ANSI.white}dig${ANSI.dim} to find the IP first, then run rev-dns on it.`);
    }

    const parts = ip.split(".");
    const ptrName = parts.reverse().join(".") + ".in-addr.arpa";

    let o = `> dig -x ${ip} +short\n`;

    try {
        const resp = await chrome.runtime.sendMessage({
            command: "dns",
            payload: { domain: ptrName, type: "PTR" },
        });

        if (!resp || resp.error) {
            o += `${ANSI.red}${resp?.error || "No response from DNS resolver"}${ANSI.reset}\n`;
            o += `\n${ANSI.dim}Executed: DNS PTR lookup via dns.google${ANSI.reset}`;
            o += insights([{ level: "WARN", text: "No reverse DNS entry found for this IP." }]);
            return o;
        }

        const answers = resp.data?.Answer || [];
        const ins = [];

        if (answers.length === 0) {
            o += `${ANSI.dim}(no PTR record)${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "No reverse DNS entry. IP may not have a PTR record." });
            ins.push({ level: "INFO", text: "Missing rDNS can cause email delivery issues if this IP sends mail." });
        } else {
            for (const a of answers) {
                const hostname = (a.data || "").replace(/\.$/, "");
                o += `${ANSI.white}${hostname}${ANSI.reset}\n`;
                ins.push({ level: "PASS", text: `Hostname: ${hostname}` });
                const provider = await resolveProvider(ip);
                if (provider) ins.push({ level: "INFO", text: `Owner: ${provider}` });
            }
        }

        ins.push({ level: "INFO", text: `Test Reverse DNS: https://mxtoolbox.com/ReverseLookup.aspx` });

        o += `\n${ANSI.dim}Executed: DNS PTR lookup via dns.google${ANSI.reset}`;
        o += insights(ins);
        return o;
    } catch (err) {
        return cmdError(` ${err.message}`);
    }
}
