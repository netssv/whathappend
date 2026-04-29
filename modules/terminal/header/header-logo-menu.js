// header-logo-menu — Favicon dropdown utility menu
import { term, showBanner, refitTerminal } from "../terminal-ui.js";
import { InputEvents } from "../input/events.js";

let _headerHidden = false;

export function initLogoMenu() {
    const logo = document.getElementById("logo-wrapper");
    const menu = document.getElementById("logo-menu");
    if (!logo || !menu) return;

    // Toggle menu on click
    logo.addEventListener("click", (e) => {
        e.stopPropagation();
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
            const current = config["auto-hide"] !== undefined ? config["auto-hide"] : true;
            const newVal = !current;
            term.write(`config auto-hide ${newVal}\r\n`);
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `config auto-hide ${newVal}`);
            
            // Re-evaluate triad visibility after brief delay to allow config to save
            setTimeout(() => {
                import("./header-triad.js").then(m => m.refreshTriadVisibility());
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
