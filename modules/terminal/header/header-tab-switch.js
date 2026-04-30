/**
 * @module modules/terminal/header/header-tab-switch.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - refitTerminal from '../terminal-ui.js'
 * - Exports: showTabSwitch, hideTabSwitch
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

import { refitTerminal } from "../terminal-ui.js";

// ===================================================================
// Tab-Switch Notification Bar
//
// Shows a dismissable bar when the user navigates to a different
// domain in the browser, offering a one-click "Switch" action.
// ===================================================================

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
