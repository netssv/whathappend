/**
 * @module modules/terminal/header/header-logo-menu.js
 * @description Favicon dropdown utility menu with nested hover submenus.
 * 
 * @connections
 * - Imports: initTabsSubmenu, initMenuActions, initMenuDelegation
 * - Exports: initLogoMenu
 * - Layer: Terminal Layer (Header)
 */

import { initTabsSubmenu } from "./menu-tabs.js";
import { initMenuActions } from "./menu-actions.js";
import { initMenuDelegation } from "./menu-delegation.js";
import { MENU_HTML } from "./menu-template.js";

export function initLogoMenu() {
    const logo = document.getElementById("logo-wrapper");
    const menu = document.getElementById("logo-menu");
    if (!logo || !menu) return;

    // Inject the HTML template
    menu.innerHTML = MENU_HTML;

    // Toggle menu on logo click
    logo.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        // Update Auto-Hide text before opening
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const isAutoHidden = config["autoHide"] !== undefined ? config["autoHide"] : true;
            const btn = document.getElementById("menu-toggle-header");
            if (btn) btn.innerHTML = `<span>◫</span> Auto-Hide: ${isAutoHidden ? "ON" : "OFF"}`;
        } catch {}

        menu.classList.toggle("open");
        
        // Remove animation hint on first click
        const icon = document.getElementById("context-logo");
        if (icon) icon.classList.remove("pulse-hint");
    });

    // Close menu on outside click — with a short grace delay
    let _closeTimer = null;
    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !logo.contains(e.target)) {
            _closeTimer = setTimeout(() => menu.classList.remove("open"), 300);
        }
    });

    // Cancel pending close when mouse re-enters the menu
    menu.addEventListener("mouseenter", () => {
        if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }
    });

    // Initialize submodules
    initTabsSubmenu(menu);
    initMenuActions(menu);
    initMenuDelegation(menu);
}
