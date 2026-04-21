import { ContextManager } from "../context.js";

const contextDomainInput = document.getElementById("context-domain");
const contextRegistrar = document.getElementById("context-registrar");
const contextExpiry = document.getElementById("context-expiry");
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
export function updateWhoisFields(registrar, expiryDate) {
    if (contextRegistrar) {
        contextRegistrar.textContent = registrar || "";
        contextRegistrar.title = registrar ? `Registrar: ${registrar}` : "";
    }
    if (contextExpiry && expiryDate) {
        const dd = Math.floor((new Date(expiryDate) - new Date()) / 864e5);
        const label = dd < 0 ? `EXP ${Math.abs(dd)}d ago` : `${dd}d`;
        contextExpiry.textContent = label;
        contextExpiry.title = `Expiry: ${expiryDate.slice(0, 10)} (${dd < 0 ? "EXPIRED" : dd + " days remaining"})`;
        contextExpiry.classList.remove("expiry-warn", "expiry-crit");
        if (dd < 0) contextExpiry.classList.add("expiry-crit");
        else if (dd < 30) contextExpiry.classList.add("expiry-warn");
    } else if (contextExpiry) {
        contextExpiry.textContent = "";
        contextExpiry.title = "";
        contextExpiry.classList.remove("expiry-warn", "expiry-crit");
    }
}

/**
 * Clear the WHOIS metadata badges (called before a new async lookup starts).
 */
export function clearWhoisFields() {
    if (contextRegistrar) { contextRegistrar.textContent = ""; contextRegistrar.title = ""; }
    if (contextExpiry) { contextExpiry.textContent = ""; contextExpiry.title = ""; contextExpiry.classList.remove("expiry-warn", "expiry-crit"); }
}
