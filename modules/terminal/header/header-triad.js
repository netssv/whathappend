import { ContextManager } from "../../context.js";
import { refitTerminal } from "../terminal-ui.js";
import { toApex } from "../../formatter.js";
import { setSessionTriad } from "../../state.js";
import { handleTriadRetryClick } from "./header-retry.js";

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

function cleanProviderName(name) {
    if (!name) return "";
    return name
        .replace(/,?\s+Inc\.?$/i, "")
        .replace(/,?\s+LLC\.?$/i, "")
        .replace(/,?\s+LTD\.?$/i, "")
        .replace(/\s+GmbH$/i, "")
        .replace(/\s+NOC$/i, "")
        .replace(/\s+Group$/i, "")
        .replace(/Amazon\.com Services LLC/i, "AWS")
        .replace(/Amazon Data Services.*/i, "AWS")
        .replace(/Google LLC/i, "Google")
        .trim();
}

function setTriadValue(el, text, url) {
    if (!el) return;
    const cleanText = cleanProviderName(text);
    el.textContent = cleanText || "";
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
    
    // Trigger subtle pop animation on value update
    el.classList.remove("pop");
    void el.offsetWidth; // Force DOM reflow to restart animation
    if (cleanText) el.classList.add("pop");

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
            let type;
            if (retryTarget === contextRegistrar) type = "registrar";
            else if (retryTarget === contextNS) type = "ns";
            else if (retryTarget === contextHost) type = "host";
            if (type) handleTriadRetryClick(retryTarget, type, setTriadValue);
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

