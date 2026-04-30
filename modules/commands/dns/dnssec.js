/**
 * @module modules/commands/dns/dnssec.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, formatError, workerError from '../../formatter.js'
 * - Exports: cmdDnssec
 * - Layer: Command Layer (DNS) - Executes DNS resolution and formatting.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError, workerError } from "../../formatter.js";

// ===================================================================
//  dnssec — Zone Integrity Check
// ===================================================================

export async function cmdDnssec(args) {
    const info = {};
    const t = resolveTargetDomain(args[0], info);
    if (!t) return cmdUsage("dnssec", "<domain>");
    
    let o = `> dnssec ${t}\n`;
    
    try {
        // We check DS records first, if none we check DNSKEY.
        const respDS = await chrome.runtime.sendMessage({ command: "dns", payload: { domain: t, type: "DS" } });
        if (!respDS) return o + workerError();
        
        let dsRecords = respDS.data?.Answer || [];
        
        const respDNSKEY = await chrome.runtime.sendMessage({ command: "dns", payload: { domain: t, type: "DNSKEY" } });
        let dnskeyRecords = respDNSKEY?.data?.Answer || [];
        
        // If both are empty, DNSSEC is likely not configured or the resolvers do not see it
        if (dsRecords.length === 0 && dnskeyRecords.length === 0) {
            o += `  ${ANSI.dim}No DS or DNSKEY records found.${ANSI.reset}\n`;
            return o + insights([{ level: "INFO", text: "DNSSEC is not enabled or not discoverable on this zone." }]);
        }
        
        // Print the records
        if (dsRecords.length > 0) {
            o += `\n  ${ANSI.cyan}Delegation Signer (DS) Records:${ANSI.reset}\n`;
            for (const r of dsRecords) {
                o += `  ${ANSI.dim}${t}. IN DS${ANSI.reset} ${r.data}\n`;
            }
        }
        
        if (dnskeyRecords.length > 0) {
            o += `\n  ${ANSI.cyan}DNS Public Key (DNSKEY) Records:${ANSI.reset}\n`;
            for (const r of dnskeyRecords) {
                // Truncate long DNSKEY strings for display
                const keyStr = r.data.length > 60 ? r.data.substring(0, 57) + "..." : r.data;
                o += `  ${ANSI.dim}${t}. IN DNSKEY${ANSI.reset} ${keyStr}\n`;
            }
        }
        
        o += "\n";
        return o + insights([{ level: "PASS", text: "DNSSEC is enabled. Zone is cryptographically signed." }]);
        
    } catch (e) {
        return o + formatError("DNS_ERROR", e.message, "Could not fetch DNSSEC records.");
    }
}
