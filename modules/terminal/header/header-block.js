/**
 * @module modules/terminal/header/header-block.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: refitTerminal, SETTINGS, syncState, toggle
 * - Exports: initBlockPanel, updateBlockState
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

import { refitTerminal } from "../terminal-ui.js";
import { SETTINGS, syncState, toggle } from "./header-block-core.js";

let _currentUrl = null;
let _activeTabId = null;

export function initBlockPanel() {
    const shieldBtn = document.getElementById("shield-btn");
    const panel = document.getElementById("block-panel");
    const reloadBtn = document.getElementById("block-reload");

    let blockHideTimeout = null;

    function scheduleAutoHide(delay) {
        if (blockHideTimeout) clearTimeout(blockHideTimeout);
        blockHideTimeout = setTimeout(() => {
            panel?.classList.remove("visible");
            setTimeout(() => refitTerminal(), 280);
        }, delay);
    }

    chrome.storage.local.get("wh_config").then(data => {
        const config = data["wh_config"] || {};
        const autoHide = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
        if (!autoHide) {
            panel?.classList.add("visible");
            setTimeout(() => refitTerminal(), 280);
        }
    }).catch(() => {});

    let isPinned = false;

    shieldBtn?.addEventListener("click", () => {
        panel?.classList.toggle("visible");
        setTimeout(() => refitTerminal(), 280);

        if (blockHideTimeout) clearTimeout(blockHideTimeout);

        if (panel?.classList.contains("visible") && !isPinned) {
            chrome.storage.local.get("wh_config").then(data => {
                const config = data["wh_config"] || {};
                const autoHide = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
                const delay = config["autoHideDelay"] || 15000;
                if (autoHide) scheduleAutoHide(delay);
            }).catch(() => {});
        }
    });

    shieldBtn?.addEventListener("dblclick", () => {
        isPinned = !isPinned;
        const iconSpan = document.getElementById("shield-icon");
        if (isPinned) {
            if (iconSpan) iconSpan.textContent = "📌";
            shieldBtn.classList.add("pinned");
            if (blockHideTimeout) clearTimeout(blockHideTimeout);
            panel?.classList.add("visible");
            setTimeout(() => refitTerminal(), 280);
        } else {
            if (iconSpan) iconSpan.textContent = "🛡";
            shieldBtn.classList.remove("pinned");
            if (panel?.classList.contains("visible")) {
                chrome.storage.local.get("wh_config").then(data => {
                    const config = data["wh_config"] || {};
                    const autoHide = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
                    const delay = config["autoHideDelay"] || 15000;
                    if (autoHide) scheduleAutoHide(delay);
                }).catch(() => {});
            }
        }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes["wh_config"]) {
            const oldVal = changes["wh_config"].oldValue?.["autoHideBlocker"];
            const newVal = changes["wh_config"].newValue?.["autoHideBlocker"];
            if (oldVal !== newVal && newVal !== undefined) {
                if (blockHideTimeout) clearTimeout(blockHideTimeout);
                if (!newVal || isPinned) {
                    panel?.classList.add("visible");
                    setTimeout(() => refitTerminal(), 280);
                } else if (panel?.classList.contains("visible")) {
                    const delay = changes["wh_config"].newValue?.["autoHideDelay"] || 15000;
                    scheduleAutoHide(delay);
                }
            }
        }
    });

    reloadBtn?.addEventListener("click", async () => {
        if (_activeTabId) {
            try {
                await chrome.tabs.reload(_activeTabId);
                reloadBtn.classList.remove("show");
                const status = document.getElementById("block-status");
                if (status) { status.textContent = "Reloaded"; setTimeout(() => { status.textContent = ""; }, 1500); }
            } catch {}
        }
    });

    for (const s of SETTINGS) {
        const cb = document.getElementById(s.id);
        cb?.addEventListener("change", () => toggle(s, cb, _currentUrl));
    }

    chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
        try {
            _activeTabId = activeInfo.tabId;
            const tab = await chrome.tabs.get(activeInfo.tabId);
            _currentUrl = tab.url;
            await syncState(_currentUrl);

            const panel = document.getElementById("block-panel");
            if (panel && panel.classList.contains("visible") && !isPinned) {
                panel.classList.remove("visible");
                setTimeout(() => refitTerminal(), 280);
            }
        } catch {}
    });

    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs?.[0]) {
            _activeTabId = tabs[0].id;
            _currentUrl = tabs[0].url;
            syncState(_currentUrl);
        }
    });
}

export async function updateBlockState(url) {
    _currentUrl = url;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs?.[0]) _activeTabId = tabs[0].id;
    await syncState(_currentUrl);
}
