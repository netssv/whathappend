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
import { initMenuKeyboard } from "./menu-keyboard.js";
import { MENU_HTML } from "./menu-template.js";

export function initLogoMenu() {
    const logo = document.getElementById("logo-wrapper");
    const menu = document.getElementById("logo-menu");
    if (!logo || !menu) return;

    // Inject the HTML template
    menu.innerHTML = MENU_HTML;
    import("../theme-engine.js").then(m => m.updateMenuIndicators(m.getCurrentTheme()));

    // Toggle menu on logo click
    logo.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        // Update Header Settings labels before opening
        try {
            chrome.storage.local.get("wh_config").then(data => {
                const config = data["wh_config"] || {};
                const isHidden = config["autoHide"] !== undefined ? config["autoHide"] : true;
                const isBlockerHidden = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
                
                const btnHide = document.getElementById("menu-toggle-header");
                if (btnHide) {
                    btnHide.replaceChildren();
                    const s1 = document.createElement("span"); s1.textContent = "◫";
                    btnHide.append(s1, ` Auto-Hide Triage: ${isHidden ? "ON" : "OFF"}`);
                }
                
                const btnBlocker = document.getElementById("menu-toggle-blocker");
                if (btnBlocker) {
                    btnBlocker.replaceChildren();
                    const s2 = document.createElement("span"); s2.textContent = "🛡";
                    btnBlocker.append(s2, ` Auto-Hide Blocker: ${isBlockerHidden ? "ON" : "OFF"}`);
                }
            });
        } catch {}

        // Populate custom geo locations dynamically
        try {
            const geoData = await chrome.storage.local.get("wh_geo_custom");
            const customLocs = geoData["wh_geo_custom"] || {};
            const container = document.getElementById("menu-geo-custom");
            if (container) {
                container.innerHTML = "";
                const keys = Object.keys(customLocs);
                if (keys.length > 0) {
                    const sep = document.createElement("div");
                    sep.className = "logo-menu-sep";
                    container.appendChild(sep);

                    const label = document.createElement("div");
                    label.className = "logo-menu-group-label";
                    label.textContent = "Custom";
                    container.appendChild(label);

                    for (const key of keys) {
                        const btn = document.createElement("button");
                        btn.className = "logo-menu-item";
                        btn.dataset.cmd = `geo ${key}`;
                        const pinIcon = document.createElement("span");
                        pinIcon.textContent = "📌";
                        btn.appendChild(pinIcon);
                        btn.appendChild(document.createTextNode(customLocs[key].label || key));
                        container.appendChild(btn);
                    }
                }
            }
        } catch {}

        menu.classList.toggle("open");
        logo.classList.toggle("menu-active");
        
        if (menu.classList.contains("open")) {
            // Close other overlay menus (Triad and Block Panel)
            const triad = document.getElementById("context-triad"); if (triad) triad.classList.remove("visible");
            const blockPanel = document.getElementById("block-panel"); if (blockPanel) blockPanel.classList.remove("visible");
            const peekTab = document.getElementById("header-peek-tab"); if (peekTab) peekTab.classList.remove("peek-open");

            // Shift focus out of xterm so document can catch keyboard events
            const firstItem = menu.querySelector(".logo-menu-item");
            if (firstItem) setTimeout(() => firstItem.focus({ preventScroll: true }), 10);
        }

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
                requestAnimationFrame(() => requestAnimationFrame(() => subs.forEach(s => { 
                    s.style.transition = ""; s.style.maxHeight = ""; 
                })));
            } else {
                menu.classList.remove("submenu-inline");
            }
        }
        
        // Remove animation hint on first click
        const icon = document.getElementById("context-logo");
        if (icon) icon.classList.remove("pulse-hint");
    });

    // Close menu immediately on outside click or focus change (e.g., terminal gets focus)
    document.addEventListener("click", closeMenuIfOutside);
    document.addEventListener("focusin", closeMenuIfOutside);
    
    // Close menu if user starts typing while it's open (unless they are navigating the menu itself)
    document.addEventListener("keydown", (e) => {
        if (menu.classList.contains("open") && !menu.contains(document.activeElement)) {
            // If they press a key that isn't a modifier, close the menu
            if (e.key.length === 1 || e.key === "Escape" || e.key === "Enter") {
                menu.classList.remove("open");
                logo.classList.remove("menu-active");
            }
        }
    });

    function closeMenuIfOutside(e) {
        if (!menu.contains(e.target) && !logo.contains(e.target)) {
            menu.classList.remove("open");
            logo.classList.remove("menu-active");
        }
    }

    // Initialize submodules
    initTabsSubmenu(menu);
    initMenuActions(menu);
    initMenuDelegation(menu);
    initMenuKeyboard(menu, logo);

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
            e.preventDefault();
            e.stopPropagation();

            if (!menu.classList.contains("submenu-inline")) return; // Skip accordion logic in flyout mode

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
