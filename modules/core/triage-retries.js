import { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";
import { resolveProvider, isRdapMaintainer, getProviderFromCNAME } from "../utils.js";

// ---------------------------------------------------------------------------
// Background Header Retry — Best-effort for empty triad fields
// ---------------------------------------------------------------------------

const RETRY_TIMEOUT = 15000;
let _retryGeneration = 0;

export function retryEmptyHeaderFields(domain, apexDomain, resolved) {
    const missing = [];
    if (!resolved.registrar) missing.push("registrar");
    if (!resolved.ns) missing.push("ns");
    if (!resolved.webhost) missing.push("webhost");
    if (missing.length === 0) return;

    // Increment generation — any in-flight retries from a previous target
    // will see a stale generation and discard their results
    const gen = ++_retryGeneration;

    // Fire-and-forget — no terminal output, only header updates
    for (const field of missing) {
        if (field === "registrar") {
            retryRegistrar(apexDomain, gen);
        } else if (field === "ns") {
            retryNS(apexDomain, gen); // Subdomains usually inherit NS from apex
        } else if (field === "webhost") {
            retryWebHost(domain, gen);
        }
    }
}

function isStale(gen) { return gen !== _retryGeneration; }

async function retryRegistrar(apexDomain, gen) {
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
    // Still empty — mark as user-retryable
    if (!isStale(gen)) markFieldRetryable("registrar");
}

async function retryNS(domain, gen) {
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

        // Resolve NS hostname IP → provider
        try {
            const aResp = await raceRetry(
                chrome.runtime.sendMessage({ command: "dns", payload: { domain: nsHost, type: "A" } })
            );
            if (isStale(gen)) return;
            const nsA = aResp?.data?.Answer?.find(a => a.type === 1);
            if (nsA?.data) {
                const provider = await raceRetry(resolveProvider(nsA.data));
                if (isStale(gen)) return;
                // Filter out RDAP maintainer refs (e.g. "AS8560-MNT", "CLDIN-MNT")
                if (provider && !isRdapMaintainer(provider)) {
                    updateNSField(provider, nsUrl);
                    setSessionTriad("ns", provider);
                    return;
                }
            }
        } catch (_) {}

        if (isStale(gen)) return;
        // Fallback: capitalize domain root
        const fb = nsRoot.split(".")[0];
        const label = fb.charAt(0).toUpperCase() + fb.slice(1);
        updateNSField(label, nsUrl);
        setSessionTriad("ns", label);
    } catch (_) {
        if (!isStale(gen)) markFieldRetryable("ns");
    }
}

async function retryWebHost(domain, gen) {
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
    // Still empty — mark as user-retryable
    if (!isStale(gen)) markFieldRetryable("host");
}

function raceRetry(promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("RETRY_TIMEOUT")), RETRY_TIMEOUT)),
    ]);
}
