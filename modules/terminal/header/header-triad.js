import { ContextManager } from "../../context.js";
import { refitTerminal } from "../terminal-ui.js";
import { toApex } from "../../formatter.js";
import { resolveProvider, isRdapMaintainer } from "../../utils.js";
import { setSessionTriad } from "../../state.js";

// ===================================================================
// Header Triad — Infrastructure badges (REG / NS / HOST)
//
// Manages visibility, click-to-verify, retryable state, and
// single-field retry on user click.
// ===================================================================

const contextRegistrar = document.getElementById("context-registrar");
const contextNS = document.getElementById("context-ns");
const contextHost = document.getElementById("context-host");
const contextTriad = document.getElementById("context-triad");

// ---------------------------------------------------------------------------
// Visibility + value management
// ---------------------------------------------------------------------------

function refreshTriadVisibility() {
    if (!contextTriad) return;
    const hasAny = contextRegistrar?.textContent || contextNS?.textContent || contextHost?.textContent
        || contextRegistrar?.classList.contains("retryable")
        || contextNS?.classList.contains("retryable")
        || contextHost?.classList.contains("retryable");
    if (hasAny) {
        contextTriad.classList.add("visible");
    } else {
        contextTriad.classList.remove("visible");
    }
    // Re-fit terminal after CSS transition completes
    setTimeout(() => refitTerminal(), 350);
}

function setTriadValue(el, text, url) {
    if (!el) return;
    el.textContent = text || "";
    el.title = url ? `${text} — click to verify` : (text || "");
    // Clear loading/retryable state when a real value arrives
    el.classList.remove("retryable", "retrying");
    if (url) {
        el.dataset.href = url;
        el.classList.add("clickable");
    } else {
        delete el.dataset.href;
        el.classList.remove("clickable");
    }
    refreshTriadVisibility();
}

// ---------------------------------------------------------------------------
// Click delegation: verify (populated) + retry (empty)
// ---------------------------------------------------------------------------

if (contextTriad) {
    contextTriad.addEventListener("click", (e) => {
        // Handle retry clicks on empty fields
        const retryTarget = e.target.closest(".triad-value.retryable");
        if (retryTarget) {
            _handleRetryClick(retryTarget);
            return;
        }
        // Handle verify clicks on populated fields
        const target = e.target.closest(".triad-value[data-href]");
        if (target?.dataset.href) {
            chrome.tabs.create({ url: target.dataset.href });
        }
    });
}

// ---------------------------------------------------------------------------
// Public update functions
// ---------------------------------------------------------------------------

export function updateWhoisFields(registrar, url) {
    setTriadValue(contextRegistrar, registrar, url);
}

export function updateNSField(ns, url) {
    setTriadValue(contextNS, ns, url);
}

export function updateHostField(host, url) {
    setTriadValue(contextHost, host, url);
}

/**
 * Mark a triad field as retryable (shows pulsing ↻ retry indicator).
 * @param {"registrar"|"ns"|"host"} field
 */
export function markFieldRetryable(field) {
    const el = { registrar: contextRegistrar, ns: contextNS, host: contextHost }[field];
    if (!el || el.textContent) return; // Only mark if empty
    el.classList.add("retryable");
    refreshTriadVisibility();
}

/**
 * Clear all infrastructure badges (called before a new async lookup starts).
 */
export function clearWhoisFields() {
    [contextRegistrar, contextNS, contextHost].forEach(el => {
        if (el) {
            el.textContent = ""; el.title = "";
            delete el.dataset.href;
            el.classList.remove("clickable", "retryable", "retrying");
        }
    });
    refreshTriadVisibility();
}

// ---------------------------------------------------------------------------
// Retry click handler — single-field retry on user click
// ---------------------------------------------------------------------------

const CLICK_TIMEOUT = 15000;
const race = (p) => Promise.race([p, new Promise((_, r) => setTimeout(() => r("TIMEOUT"), CLICK_TIMEOUT))]);

async function _handleRetryClick(el) {
    const domain = ContextManager.getDomain();
    if (!domain) return;
    const apexDomain = toApex(domain);

    // Show spinning loading state
    el.classList.remove("retryable");
    el.classList.add("retrying");
    el.textContent = "";

    try {
        if (el === contextRegistrar) {
            const resp = await race(chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } }));
            if (resp?.success && resp.registrar && resp.registrar !== "Unknown") {
                setTriadValue(el, resp.registrar, `https://www.whois.com/whois/${apexDomain}`);
                setSessionTriad("registrar", resp.registrar);
                return;
            }
        } else if (el === contextNS) {
            const resp = await race(chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "NS" } }));
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
        } else if (el === contextHost) {
            const resp = await race(chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "A" } }));
            const aRec = resp?.data?.Answer?.find(a => a.type === 1);
            if (aRec?.data) {
                const prov = await race(resolveProvider(aRec.data));
                if (prov && !isRdapMaintainer(prov)) {
                    setTriadValue(el, prov, `https://ipinfo.io/${aRec.data}`);
                    setSessionTriad("host", prov);
                    return;
                }
            }
        }
    } catch (_) {}

    // Still failed — re-mark as retryable
    el.classList.remove("retrying");
    el.textContent = "";
    el.classList.add("retryable");
}
