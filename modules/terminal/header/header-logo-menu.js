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

        // Detect space: if the menu's left edge is too close to the viewport
        // boundary, flyout submenus will be clipped → switch to inline mode
        if (menu.classList.contains("open")) {
            const menuRect = menu.getBoundingClientRect();
            // Submenu is ~140px wide. Check if it fits to the right.
            const needsInline = (menuRect.right + 145) > window.innerWidth;

            if (needsInline) {
                // Force submenus to snap closed BEFORE enabling inline mode
                // to prevent any CSS transition flash when the menu first opens
                const subs = menu.querySelectorAll(".logo-menu-submenu");
                subs.forEach(s => { 
                    s.style.transition = "none";
                    s.style.maxHeight = "0"; 
                });
                menu.classList.add("submenu-inline");
                
                // Release inline overrides after two paint frames 
                // so the browser registers the 0 height without animating it
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        subs.forEach(s => { 
                            s.style.transition = "";
                            s.style.maxHeight = ""; 
                        });
                    });
                });
            } else {
                menu.classList.remove("submenu-inline");
            }
        }
        
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

    // --- Accordion Logic & Exclusive Submenus ----------------------------
    const subWraps = menu.querySelectorAll(".logo-menu-sub-wrap");
    
    // 1. Hover Logic (Only for Flyout Mode - Right side)
    // Instantly closes siblings to prevent overlap when flying out.
    subWraps.forEach(wrap => {
        wrap.addEventListener("mouseenter", () => {
            if (menu.classList.contains("submenu-inline")) return; // Skip in inline mode
            subWraps.forEach(sibling => {
                if (sibling !== wrap) sibling.classList.add("sub-forced-closed");
            });
        });
        wrap.addEventListener("mouseleave", () => {
            if (menu.classList.contains("submenu-inline")) return;
            subWraps.forEach(sibling => sibling.classList.remove("sub-forced-closed"));
        });
    });

    // 2. Click Logic (Only for Inline Mode - Accordion)
    // Click-to-expand eliminates the "hover jump trap" entirely.
    const subButtons = menu.querySelectorAll(".logo-menu-has-sub");
    subButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (!menu.classList.contains("submenu-inline")) return; // Skip in flyout mode
            e.preventDefault();
            e.stopPropagation();

            const parentWrap = btn.closest(".logo-menu-sub-wrap");
            const isCurrentlyOpen = parentWrap.classList.contains("sub-expanded");

            // Close all others
            subWraps.forEach(wrap => wrap.classList.remove("sub-expanded"));

            // Toggle the clicked one
            if (!isCurrentlyOpen) {
                parentWrap.classList.add("sub-expanded");
            }
        });
    });
}
