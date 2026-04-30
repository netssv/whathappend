/**
 * @module modules/terminal/header/header-domain.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ContextManager from '../../context.js'
 * - Exports: initDomainInput, isHeaderFocused
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

import { ContextManager } from "../../context.js";

// ===================================================================
// Header Domain Input — Click-to-edit domain targeting
// ===================================================================

const contextDomainInput = document.getElementById("context-domain");
let _headerPreviousValue = "";
let _terminalInstance = null;

export function initDomainInput(term) {
    _terminalInstance = term;

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
                if (_terminalInstance) _terminalInstance.focus();
                
            } else if (e.key === "Escape") {
                contextDomainInput.value = _headerPreviousValue;
                contextDomainInput.setAttribute("readonly", "");
                contextDomainInput.classList.remove("editing");
                contextDomainInput.blur();
                
                if (_terminalInstance) _terminalInstance.focus();
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
