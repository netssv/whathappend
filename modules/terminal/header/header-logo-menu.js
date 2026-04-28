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
    });

    // Close menu on outside click
    document.addEventListener("click", () => menu.classList.remove("open"));

    // ── Clear Terminal ───────────────────────────────────────
    document.getElementById("menu-clear")?.addEventListener("click", () => {
        menu.classList.remove("open");
        term.clear();
        showBanner();
        term.focus();
    });

    // ── Toggle Header ────────────────────────────────────────
    document.getElementById("menu-toggle-header")?.addEventListener("click", () => {
        menu.classList.remove("open");
        const triad = document.getElementById("context-triad");
        const blockPanel = document.getElementById("block-panel");

        if (_headerHidden) {
            triad?.classList.add("visible");
            _headerHidden = false;
        } else {
            triad?.classList.remove("visible");
            blockPanel?.classList.remove("visible");
            _headerHidden = true;
        }
        setTimeout(() => refitTerminal(), 300);
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
