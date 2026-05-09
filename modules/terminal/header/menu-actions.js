/**
 * @module modules/terminal/header/menu-actions.js
 * @description Attaches static click handlers for direct menu actions.
 */

import { term, showBanner } from "../terminal-ui.js";
import { InputEvents } from "../input/events.js";

function closeMenuAndExecute(e, menu, command) {
    if (e) e.stopPropagation();
    menu.classList.remove("open");
    document.getElementById("logo-wrapper")?.classList.remove("menu-active");
    if (command) InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, command);
    term.focus();
}

export function initMenuActions(menu) {
    document.getElementById("menu-start")?.addEventListener("click", (e) => closeMenuAndExecute(e, menu, "start"));
    document.getElementById("menu-export")?.addEventListener("click", (e) => closeMenuAndExecute(e, menu, "export"));
    document.getElementById("menu-clip")?.addEventListener("click", (e) => closeMenuAndExecute(e, menu, "clip"));
    document.getElementById("menu-about")?.addEventListener("click", (e) => closeMenuAndExecute(e, menu, "about"));

    document.getElementById("menu-new-session")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        const { TerminalMultiplexer } = await import("../terminal-multiplexer.js");
        await TerminalMultiplexer.createSession();
    });

    document.getElementById("menu-clear")?.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        term.clear();
        showBanner();
        term.focus();
    });

    document.getElementById("menu-toggle-header")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const current = config["autoHide"] !== undefined ? config["autoHide"] : true;
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `config autoHide ${!current}`);
            setTimeout(() => import("./header-triad.js").then(m => m.pingTriadVisibility()), 100);
        } catch {}
        term.focus();
    });

    document.getElementById("menu-toggle-blocker")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        try {
            const data = await chrome.storage.local.get("wh_config");
            const config = data["wh_config"] || {};
            const current = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `config autoHideBlocker ${!current}`);
        } catch {}
        term.focus();
    });

    document.getElementById("menu-reload-tab")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) await chrome.tabs.reload(tabs[0].id);
        } catch {}
        term.focus();
    });

    document.getElementById("menu-reload-ext")?.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        chrome.runtime.reload();
    });

    // "Add Location" — opens a modal dialog for inputting custom geo coordinates
    document.getElementById("menu-geo-add")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        document.getElementById("logo-wrapper")?.classList.remove("menu-active");
        const logo = document.getElementById("logo-wrapper");
        if (logo) logo.classList.remove("menu-active");

        const { showModal } = await import("../modal.js");
        const result = await showModal({
            title: "📍 Add Location",
            fields: [
                { id: "name", label: "Name", placeholder: "office", hint: "Unique identifier" },
                { id: "lat",  label: "Latitude",  type: "number", placeholder: "13.68", row: 1, step: "any" },
                { id: "lng",  label: "Longitude", type: "number", placeholder: "-89.23", row: 1, step: "any" },
            ],
            submitLabel: "Save",
            validate: (v) => {
                if (!v.name) return "Name is required.";
                if (!/^[a-zA-Z0-9_-]+$/.test(v.name)) return "Name: letters, numbers, - and _ only.";
                const lat = parseFloat(v.lat), lng = parseFloat(v.lng);
                if (isNaN(lat) || isNaN(lng)) return "Latitude and longitude are required.";
                if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
                if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
                return null;
            }
        });

        if (result) {
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `geo add ${result.name} ${result.lat} ${result.lng}`);
        }
        term.focus();
    });
}
