/**
 * @module modules/terminal/header/header-logo-menu.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - term, showBanner, refitTerminal from '../terminal-ui.js'
 *     - InputEvents from '../input/events.js'
 * - Exports: initLogoMenu
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

// header-logo-menu — Favicon dropdown utility menu
import { term, showBanner, refitTerminal } from "../terminal-ui.js";
import { InputEvents } from "../input/events.js";

let _headerHidden = false;

export function initLogoMenu() {
    const logo = document.getElementById("logo-wrapper");
    const menu = document.getElementById("logo-menu");
    if (!logo || !menu) return;

    // Toggle menu on click
    logo.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        // Update Auto-Hide text based on config before opening
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const isAutoHidden = config["autoHide"] !== undefined ? config["autoHide"] : true;
            
            const btn = document.getElementById("menu-toggle-header");
            if (btn) {
                btn.innerHTML = `<span>◫</span> Auto-Hide: ${isAutoHidden ? "ON" : "OFF"}`;
            }
        } catch {}

        menu.classList.toggle("open");
        
        // Remove animation hint on first click
        const icon = document.getElementById("context-logo");
        if (icon) icon.classList.remove("pulse-hint");
    });

    // Close menu on outside click
    document.addEventListener("click", () => menu.classList.remove("open"));

    // ── Tabs ─────────────────────────────────────────────────
    document.getElementById("menu-tabs")?.addEventListener("click", () => {
        menu.classList.remove("open");
        term.write("tabs\r\n");
        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, "tabs");
        term.focus();
    });

    // ── Clear Terminal ───────────────────────────────────────
    document.getElementById("menu-clear")?.addEventListener("click", () => {
        menu.classList.remove("open");
        term.clear();
        showBanner();
        term.focus();
    });

    // ── Toggle Auto-Hide ────────────────────────────────────────
    document.getElementById("menu-toggle-header")?.addEventListener("click", async () => {
        menu.classList.remove("open");
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const current = config["autoHide"] !== undefined ? config["autoHide"] : true;
            const newVal = !current;
            term.write(`config autoHide ${newVal}\r\n`);
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `config autoHide ${newVal}`);
            
            // Re-evaluate triad visibility after brief delay to allow config to save
            setTimeout(() => {
                import("./header-triad.js").then(m => m.pingTriadVisibility());
            }, 100);
        } catch {}
        term.focus();
    });

    // ── Reload Active Tab ────────────────────────────────────
    document.getElementById("menu-reload-tab")?.addEventListener("click", async () => {
        menu.classList.remove("open");
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) await chrome.tabs.reload(tabs[0].id);
        } catch {}
        term.focus();
    });

    // ── Reload Extension ─────────────────────────────────────
    document.getElementById("menu-reload-ext")?.addEventListener("click", () => {
        menu.classList.remove("open");
        chrome.runtime.reload();
    });

    // ── About ────────────────────────────────────────────────
    document.getElementById("menu-about")?.addEventListener("click", () => {
        menu.classList.remove("open");
        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, "about");
    });
}
