/**
 * @module modules/terminal/header/header-retry.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ContextManager from '../../context.js'
 *     - toApex from '../../formatter.js'
 *     - resolveProvider, isRdapMaintainer, getProviderFromCNAME from '../../utils.js'
 *     - setSessionTriad from '../../state.js'
 * - Exports: handleTriadRetryClick
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

import { ContextManager } from "../../context.js";
import { toApex } from "../../formatter.js";
import { resolveProvider, isRdapMaintainer, getProviderFromCNAME } from "../../utils.js";
import { setSessionTriad } from "../../state.js";

// ===================================================================
// Header Retry Logic — Async fetches for empty triad fields
// ===================================================================

const CLICK_TIMEOUT = 15000;
const race = (p) => Promise.race([p, new Promise((_, r) => setTimeout(() => r("TIMEOUT"), CLICK_TIMEOUT))]);

/**
 * Handles user clicks on empty/failed triad badges to retry the lookup.
 */
export async function handleTriadRetryClick(el, type, setTriadValue) {
    const domain = ContextManager.getDomain();
    if (!domain) return;
    const apexDomain = toApex(domain);

    // Show spinning loading state
    el.classList.remove("retryable");
    el.classList.add("retrying");
    el.textContent = "";

    try {
        if (type === "registrar") {
            const resp = await race(chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } }));
            if (resp?.success && resp.registrar && resp.registrar !== "Unknown") {
                setTriadValue(el, resp.registrar, `https://www.whois.com/whois/${apexDomain}`);
                setSessionTriad("registrar", resp.registrar);
                return;
            }
        } else if (type === "ns") {
            const resp = await race(chrome.runtime.sendMessage({ command: "dns", payload: { domain: apexDomain, type: "NS" } }));
            const nsRecords = resp?.data?.Answer?.filter(a => a.type === 2);
            if (nsRecords?.length > 0) {
                const nsHost = nsRecords[0].data.replace(/\.$/, "");
                const nsRoot = nsHost.split(".").slice(-2).join(".");
                const targetRoot = domain.split(".").slice(-2).join(".");
                const nsUrl = `https://intodns.com/${domain}`;
                if (nsRoot === targetRoot) {
                    const label = `Self-hosted (${targetRoot})`;
                    setTriadValue(el, label, nsUrl);
                    setSessionTriad("ns", label);
                    return;
                }
                // Try IP-based provider resolution
                const aResp = await race(chrome.runtime.sendMessage({ command: "dns", payload: { domain: nsHost, type: "A" } }));
                const nsA = aResp?.data?.Answer?.find(a => a.type === 1);
                if (nsA?.data) {
                    const prov = await race(resolveProvider(nsA.data));
                    if (prov && !isRdapMaintainer(prov)) {
                        setTriadValue(el, prov, nsUrl);
                        setSessionTriad("ns", prov);
                        return;
                    }
                }
                // Fallback: domain name
                const fb = nsRoot.split(".")[0];
                const label = fb.charAt(0).toUpperCase() + fb.slice(1);
                setTriadValue(el, label, nsUrl);
                setSessionTriad("ns", label);
                return;
            }
        } else if (type === "host") {
            const resp = await race(chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "A" } }));
            let finalProv = null;
            let ip = null;

            const aRec = resp?.data?.Answer?.find(a => a.type === 1);
            if (aRec?.data) {
                ip = aRec.data;
                const prov = await race(resolveProvider(ip));
                if (prov && !isRdapMaintainer(prov)) {
                    finalProv = prov;
                }
            }

            if (!finalProv) {
                // Try CNAME fallback if RDAP fails or IP is unknown
                const cnameRec = resp?.data?.Answer?.find(a => a.type === 5);
                if (cnameRec?.data) {
                    finalProv = getProviderFromCNAME(cnameRec.data);
                }
            }

            if (finalProv) {
                setTriadValue(el, finalProv, ip ? `https://ipinfo.io/${ip}` : `https://intodns.com/${domain}`);
                setSessionTriad("host", finalProv);
                return;
            }
        }
    } catch (_) {}

    // Still failed — re-mark as retryable
    el.classList.remove("retrying");
    el.textContent = "";
    el.classList.add("retryable");
}
