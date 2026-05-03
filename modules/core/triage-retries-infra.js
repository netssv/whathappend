/**
 * @module modules/core/triage-retries-infra.js
 * @description Background retry resolvers for infrastructure fields.
 *
 * @connections
 * - Imports: updateWhoisFields, updateNSField, updateHostField, markFieldRetryable
 * - Exports: retryRegistrar, retryNS, retryWebHost
 * - Layer: Core Layer
 */

import { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";
import { resolveProvider, isRdapMaintainer, getProviderFromCNAME } from "../utils.js";

const RETRY_TIMEOUT = 15000;

export async function retryRegistrar(apexDomain, isStale, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } })
        );
        if (isStale(gen)) return;
        if (resp?.success && resp.registrar && resp.registrar !== "Unknown") {
            updateWhoisFields(resp.registrar, `https://www.whois.com/whois/${apexDomain}`);
            setSessionTriad("registrar", resp.registrar);
            return;
        }
    } catch (_) {}
    if (!isStale(gen)) markFieldRetryable("registrar");
}

export async function retryNS(domain, isStale, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "NS" } })
        );
        if (isStale(gen)) return;
        const nsRecords = resp?.data?.Answer?.filter(a => a.type === 2);
        if (!nsRecords || nsRecords.length === 0) {
            if (!isStale(gen)) markFieldRetryable("ns");
            return;
        }

        const nsHost = nsRecords[0].data.replace(/\.$/, "");
        const targetRoot = domain.split(".").slice(-2).join(".");
        const nsRoot = nsHost.split(".").slice(-2).join(".");
        const nsUrl = `https://intodns.com/${domain}`;

        if (nsRoot === targetRoot) {
            const label = `Self-hosted (${targetRoot})`;
            updateNSField(label, nsUrl);
            setSessionTriad("ns", label);
            return;
        }

        try {
            const aResp = await raceRetry(
                chrome.runtime.sendMessage({ command: "dns", payload: { domain: nsHost, type: "A" } })
            );
            if (isStale(gen)) return;
            const nsA = aResp?.data?.Answer?.find(a => a.type === 1);
            if (nsA?.data) {
                const provider = await raceRetry(resolveProvider(nsA.data));
                if (isStale(gen)) return;
                if (provider && !isRdapMaintainer(provider)) {
                    updateNSField(provider, nsUrl);
                    setSessionTriad("ns", provider);
                    return;
                }
            }
        } catch (_) {}

        if (isStale(gen)) return;
        const fb = nsRoot.split(".")[0];
        const label = fb.charAt(0).toUpperCase() + fb.slice(1);
        updateNSField(label, nsUrl);
        setSessionTriad("ns", label);
    } catch (_) {
        if (!isStale(gen)) markFieldRetryable("ns");
    }
}

export async function retryWebHost(domain, isStale, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "A" } })
        );
        if (isStale(gen)) return;
        const aRecord = resp?.data?.Answer?.find(a => a.type === 1);
        
        let finalProv = null;
        let ip = null;

        if (aRecord?.data) {
            ip = aRecord.data;
            const provider = await raceRetry(resolveProvider(ip));
            if (isStale(gen)) return;
            if (provider && !isRdapMaintainer(provider)) {
                finalProv = provider;
            }
        }

        if (!finalProv) {
            const cnameRec = resp?.data?.Answer?.find(a => a.type === 5);
            if (cnameRec?.data) {
                finalProv = getProviderFromCNAME(cnameRec.data);
            }
        }

        if (finalProv) {
            updateHostField(finalProv, ip ? `https://ipinfo.io/${ip}` : `https://intodns.com/${domain}`);
            setSessionTriad("host", finalProv);
            return;
        }
    } catch (_) {}
    if (!isStale(gen)) markFieldRetryable("host");
}

function raceRetry(promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("RETRY_TIMEOUT")), RETRY_TIMEOUT)),
    ]);
}
