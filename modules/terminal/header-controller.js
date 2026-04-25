import { ContextManager } from "../context.js";
import { refitTerminal } from "./terminal-ui.js";

const contextDomainInput = document.getElementById("context-domain");
const contextRegistrar = document.getElementById("context-registrar");
const contextNS = document.getElementById("context-ns");
const contextHost = document.getElementById("context-host");
const contextTriad = document.getElementById("context-triad");
let _headerPreviousValue = "";
let terminalInstance = null;

export function initHeaderController(term) {
    terminalInstance = term;

    if (contextDomainInput) {
        contextDomainInput.addEventListener("click", () => {
            _headerPreviousValue = contextDomainInput.value;
            contextDomainInput.removeAttribute("readonly");
            contextDomainInput.classList.add("editing");
            contextDomainInput.select();
        });

        contextDomainInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const newTarget = contextDomainInput.value.trim();
                contextDomainInput.setAttribute("readonly", "");
                contextDomainInput.classList.remove("editing");
                contextDomainInput.blur();

                if (newTarget && newTarget !== "No active target") {
                    ContextManager.setManualTarget(newTarget);
                    // Auto-whois is triggered via ContextManager.onTargetChanged in terminal-main.js
                }
                
                // Return focus to terminal
                if (terminalInstance) terminalInstance.focus();
                
            } else if (e.key === "Escape") {
                contextDomainInput.value = _headerPreviousValue;
                contextDomainInput.setAttribute("readonly", "");
                contextDomainInput.classList.remove("editing");
                contextDomainInput.blur();
                
                if (terminalInstance) terminalInstance.focus();
            }
        });

        contextDomainInput.addEventListener("blur", () => {
            // If still editing (not submitted via Enter), revert
            if (!contextDomainInput.hasAttribute("readonly")) {
                contextDomainInput.value = _headerPreviousValue || contextDomainInput.value;
                contextDomainInput.setAttribute("readonly", "");
                contextDomainInput.classList.remove("editing");
            }
        });
    }
}

/**
 * Check if the header input is currently the active/focused element.
 */
export function isHeaderFocused() {
    return contextDomainInput && document.activeElement === contextDomainInput;
}

// ---------------------------------------------------------------------------
// Triad visibility + click-to-verify
// ---------------------------------------------------------------------------

function refreshTriadVisibility() {
    if (!contextTriad) return;
    const hasAny = contextRegistrar?.textContent || contextNS?.textContent || contextHost?.textContent;
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
    if (url) {
        el.dataset.href = url;
        el.classList.add("clickable");
    } else {
        delete el.dataset.href;
        el.classList.remove("clickable");
    }
    refreshTriadVisibility();
}

// One-time click delegation on the triad container
if (contextTriad) {
    contextTriad.addEventListener("click", (e) => {
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
 * Clear all infrastructure badges (called before a new async lookup starts).
 */
export function clearWhoisFields() {
    [contextRegistrar, contextNS, contextHost].forEach(el => {
        if (el) {
            el.textContent = ""; el.title = "";
            delete el.dataset.href;
            el.classList.remove("clickable");
        }
    });
    refreshTriadVisibility();
}

// ---------------------------------------------------------------------------
// Tab-Switch Notification Bar
// ---------------------------------------------------------------------------

const tabSwitchBar = document.getElementById("tab-switch-bar");
const tabSwitchDomain = document.getElementById("tab-switch-domain");
const tabSwitchBtn = document.getElementById("tab-switch-btn");
const tabSwitchDismiss = document.getElementById("tab-switch-dismiss");
let _tabSwitchTimer = null;
let _onSwitchCallback = null;

if (tabSwitchBtn) {
    tabSwitchBtn.addEventListener("click", () => {
        const domain = tabSwitchDomain?.textContent;
        if (domain && typeof _onSwitchCallback === "function") {
            _onSwitchCallback(domain);
        }
        hideTabSwitch();
    });
}

if (tabSwitchDismiss) {
    tabSwitchDismiss.addEventListener("click", () => {
        hideTabSwitch();
    });
}

/**
 * Show the tab-switch notification bar with the new domain.
 * @param {string} domain - The new tab's domain
 * @param {Function} onSwitch - Callback if user clicks "Switch"
 */
export function showTabSwitch(domain, onSwitch) {
    if (!tabSwitchBar || !tabSwitchDomain) return;
    // Clear any previous auto-dismiss timer
    if (_tabSwitchTimer) clearTimeout(_tabSwitchTimer);

    tabSwitchDomain.textContent = domain;
    _onSwitchCallback = onSwitch;
    tabSwitchBar.classList.add("visible");
    setTimeout(() => refitTerminal(), 300);

    // Auto-dismiss after 12 seconds
    _tabSwitchTimer = setTimeout(() => hideTabSwitch(), 12000);
}

export function hideTabSwitch() {
    if (_tabSwitchTimer) { clearTimeout(_tabSwitchTimer); _tabSwitchTimer = null; }
    if (tabSwitchBar) tabSwitchBar.classList.remove("visible");
    _onSwitchCallback = null;
    setTimeout(() => refitTerminal(), 300);
}
