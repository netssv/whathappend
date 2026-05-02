/**
 * @module modules/terminal/header/menu-actions.js
 * @description Attaches static click handlers for direct menu actions.
 */

import { term, showBanner } from "../terminal-ui.js";
import { InputEvents } from "../input/events.js";

function closeMenuAndExecute(menu, command) {
    menu.classList.remove("open");
    if (command) InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, command);
    term.focus();
}

export function initMenuActions(menu) {
    document.getElementById("menu-start")?.addEventListener("click", () => closeMenuAndExecute(menu, "start"));
    document.getElementById("menu-export")?.addEventListener("click", () => closeMenuAndExecute(menu, "export"));
    document.getElementById("menu-clip")?.addEventListener("click", () => closeMenuAndExecute(menu, "clip"));
    document.getElementById("menu-about")?.addEventListener("click", () => closeMenuAndExecute(menu, "about"));

    document.getElementById("menu-clear")?.addEventListener("click", () => {
        menu.classList.remove("open");
        term.clear();
        showBanner();
        term.focus();
    });

    document.getElementById("menu-toggle-header")?.addEventListener("click", async () => {
        menu.classList.remove("open");
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const current = config["autoHide"] !== undefined ? config["autoHide"] : true;
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `config autoHide ${!current}`);
            setTimeout(() => import("./header-triad.js").then(m => m.pingTriadVisibility()), 100);
        } catch {}
        term.focus();
    });

    document.getElementById("menu-reload-tab")?.addEventListener("click", async () => {
        menu.classList.remove("open");
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) await chrome.tabs.reload(tabs[0].id);
        } catch {}
        term.focus();
    });

    document.getElementById("menu-reload-ext")?.addEventListener("click", () => {
        menu.classList.remove("open");
        chrome.runtime.reload();
    });
}
