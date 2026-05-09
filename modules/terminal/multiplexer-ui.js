/**
 * @module modules/terminal/multiplexer-ui.js
 * @description UI helper functions for the terminal multiplexer.
 *              Handles tab DOM creation, DOM updates, and extension badge state.
 *
 * @connections
 * - Imports: toApex from '../formatter.js'
 * - Exports: createTabDOM, updateTabDomainUI, updateTabActivityUI, syncChromeBadge
 * - Layer: Terminal Layer (UI)
 */

import { toApex } from "../formatter.js";

export function createTabDOM(id) {
    const tabEl = document.createElement("div");
    tabEl.className = "multiplexer-tab";
    tabEl.dataset.tabId = id;
    tabEl.title = `Terminal Session ${id}`;
    tabEl.innerHTML = `
        <span class="tab-indicator">●</span>
        <span class="tab-title">Term ${id}</span>
        <span class="tab-close" title="Close Session">✕</span>
    `;
    return tabEl;
}

export function updateTabDomainUI(tabEl, domain) {
    if (!tabEl) return;
    const titleEl = tabEl.querySelector(".tab-title");
    if (titleEl) titleEl.textContent = domain;
    
    const indicatorEl = tabEl.querySelector(".tab-indicator");
    if (indicatorEl) {
        const apex = toApex(domain);
        indicatorEl.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${apex}&sz=16" width="12" height="12" style="border-radius:2px; vertical-align:middle;">`;
    }
}

export function updateTabActivityUI(tabEl, state) {
    if (!tabEl) return;
    tabEl.classList.remove("tab-idle", "tab-processing", "tab-watching");
    if (state !== "idle") {
        tabEl.classList.add(`tab-${state}`);
    }
}

export function syncChromeBadge(sessions) {
    try {
        const isBusy = sessions.some(s => s.activity && s.activity !== "idle");
        if (isBusy) {
            chrome.action.setBadgeText({ text: "LIVE" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // green
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    } catch {}
}
