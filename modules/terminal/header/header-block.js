// ===================================================================
//  header-block — Shield indicator + content block panel controller
//
//  Reads/writes chrome.contentSettings for the active tab's origin.
//  Updates UI toggles and shield indicator in real-time.
// ===================================================================

import { refitTerminal } from "../terminal-ui.js";

const SETTINGS = [
    { id: "block-js",     api: "javascript" },
    { id: "block-images", api: "images" },
    { id: "block-popups", api: "popups" },
];

let _currentUrl = null;

function getPattern(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.hostname}/*`;
    } catch { return null; }
}

/** Read current content settings for the active tab and sync checkboxes. */
async function syncState() {
    const shieldBtn = document.getElementById("shield-btn");
    if (!_currentUrl || !_currentUrl.startsWith("http")) {
        shieldBtn?.classList.remove("active");
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

    if (anyBlocked) {
        shieldBtn?.classList.add("active");
    } else {
        shieldBtn?.classList.remove("active");
    }
}

/** Toggle a single content setting and update status. */
async function toggle(api, checkbox) {
    const pattern = getPattern(_currentUrl);
    if (!pattern) return;

    const status = document.getElementById("block-status");
    const setting = checkbox.checked ? "block" : "allow";

    try {
        if (status) { status.textContent = "Saving…"; status.classList.add("saving"); }
        await chrome.contentSettings[api].set({ primaryPattern: pattern, setting });
        if (status) {
            status.textContent = "Reload tab to apply";
            setTimeout(() => { status.textContent = ""; status.classList.remove("saving"); }, 2500);
        }
    } catch (err) {
        if (status) { status.textContent = "Error"; status.classList.remove("saving"); }
        checkbox.checked = !checkbox.checked; // revert
    }

    // Update shield indicator
    const anyBlocked = SETTINGS.some(s => document.getElementById(s.id)?.checked);
    const shieldBtn = document.getElementById("shield-btn");
    shieldBtn?.classList.toggle("active", anyBlocked);
}

export function initBlockPanel() {
    const shieldBtn = document.getElementById("shield-btn");
    const panel = document.getElementById("block-panel");

    // Toggle panel visibility
    shieldBtn?.addEventListener("click", () => {
        panel?.classList.toggle("visible");
        refitTerminal();
    });

    // Wire toggle checkboxes
    for (const { id, api } of SETTINGS) {
        const cb = document.getElementById(id);
        cb?.addEventListener("change", () => toggle(api, cb));
    }

    // Listen for active tab changes to sync state
    chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            _currentUrl = tab.url;
            await syncState();
        } catch {}
    });
}

/** Called when domain context changes (e.g. switch command, auto-target). */
export async function updateBlockState(url) {
    _currentUrl = url;
    await syncState();
}
