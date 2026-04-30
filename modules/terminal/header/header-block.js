/**
 * @module modules/terminal/header/header-block.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - refitTerminal from '../terminal-ui.js'
 * - Exports: initBlockPanel, updateBlockState
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

// header-block — Shield indicator + content block panel controller
import { refitTerminal } from "../terminal-ui.js";

const SETTINGS = [
    { id: "block-js",     api: "javascript" },
    { id: "block-images", api: "images" },
    { id: "block-popups", api: "popups" },
];

let _currentUrl = null;
let _activeTabId = null;

function getPattern(url) {
    try { const u = new URL(url); return `${u.protocol}//${u.hostname}/*`; }
    catch { return null; }
}

async function syncState() {
    const shieldBtn = document.getElementById("shield-btn");
    const reloadBtn = document.getElementById("block-reload");
    if (!_currentUrl || !_currentUrl.startsWith("http")) {
        shieldBtn?.classList.remove("active");
        reloadBtn?.classList.remove("show");
        return;
    }

    let anyBlocked = false;
    for (const { id, api } of SETTINGS) {
        const cb = document.getElementById(id);
        if (!cb) continue;
        try {
            const result = await chrome.contentSettings[api].get({ primaryUrl: _currentUrl });
            const blocked = result.setting === "block";
            cb.checked = blocked;
            if (blocked) anyBlocked = true;
        } catch { cb.checked = false; }
    }

    shieldBtn?.classList.toggle("active", anyBlocked);
}

async function toggle(api, checkbox) {
    const pattern = getPattern(_currentUrl);
    if (!pattern) return;

    const status = document.getElementById("block-status");
    const reloadBtn = document.getElementById("block-reload");
    const setting = checkbox.checked ? "block" : "allow";

    try {
        if (status) { status.textContent = "Saving…"; status.classList.add("saving"); }
        await chrome.contentSettings[api].set({ primaryPattern: pattern, setting });
        if (status) { status.textContent = ""; status.classList.remove("saving"); }
        // Show reload button
        reloadBtn?.classList.add("show");
    } catch {
        if (status) { status.textContent = "Error"; status.classList.remove("saving"); }
        checkbox.checked = !checkbox.checked;
    }

    const anyBlocked = SETTINGS.some(s => document.getElementById(s.id)?.checked);
    document.getElementById("shield-btn")?.classList.toggle("active", anyBlocked);
}

export function initBlockPanel() {
    const shieldBtn = document.getElementById("shield-btn");
    const panel = document.getElementById("block-panel");
    const reloadBtn = document.getElementById("block-reload");

    shieldBtn?.addEventListener("click", () => {
        panel?.classList.toggle("visible");
        // Delay refit to let CSS transition complete
        setTimeout(() => refitTerminal(), 280);
    });

    // Reload active tab button
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

    for (const { id, api } of SETTINGS) {
        const cb = document.getElementById(id);
        cb?.addEventListener("change", () => toggle(api, cb));
    }

    chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
        try {
            _activeTabId = activeInfo.tabId;
            const tab = await chrome.tabs.get(activeInfo.tabId);
            _currentUrl = tab.url;
            await syncState();

            // Auto hide block panel on tab switch
            const panel = document.getElementById("block-panel");
            if (panel && panel.classList.contains("visible")) {
                panel.classList.remove("visible");
                setTimeout(() => refitTerminal(), 280);
            }
        } catch {}
    });

    // Init with current active tab
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs?.[0]) {
            _activeTabId = tabs[0].id;
            _currentUrl = tabs[0].url;
            syncState();
        }
    });
}

export async function updateBlockState(url) {
    _currentUrl = url;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs?.[0]) _activeTabId = tabs[0].id;
    await syncState();
}
