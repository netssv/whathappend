import { ContextManager } from "../context.js";

const contextDomainInput = document.getElementById("context-domain");
const contextRegistrar = document.getElementById("context-registrar");
const contextNS = document.getElementById("context-ns");
const contextHost = document.getElementById("context-host");
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

/**
 * Update the Registrar and Expiry badges in the context bar.
 * Called asynchronously when WHOIS data arrives.
 * @param {string|null} registrar - Registrar name or null
 * @param {string|null} expiryDate - ISO date string or null
 */
export function updateWhoisFields(registrar) {
    if (contextRegistrar) {
        contextRegistrar.textContent = registrar ? registrar.split(" ")[0] : "";
        contextRegistrar.title = registrar ? `Registrar: ${registrar}` : "";
    }
}

export function updateNSField(ns) {
    if (contextNS) {
        contextNS.textContent = ns ? ns.split(" ")[0].replace(/,? inc\.?/i, '') : "";
        contextNS.title = ns ? `NameServers: ${ns}` : "";
    }
}

export function updateHostField(host) {
    if (contextHost) {
        contextHost.textContent = host ? host.split(" ")[0].replace(/,? inc\.?/i, '') : "";
        contextHost.title = host ? `Web Host: ${host}` : "";
    }
}

/**
 * Clear the WHOIS metadata badges (called before a new async lookup starts).
 */
export function clearWhoisFields() {
    if (contextRegistrar) { contextRegistrar.textContent = ""; contextRegistrar.title = ""; }
    if (contextNS) { contextNS.textContent = ""; contextNS.title = ""; }
    if (contextHost) { contextHost.textContent = ""; contextHost.title = ""; }
}
