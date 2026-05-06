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
    { id: "block-js",      api: "javascript", type: "contentSettings" },
    { id: "block-images",  api: "images",     type: "contentSettings" },
    { id: "block-cookies", api: "cookies",    type: "contentSettings" },
    { id: "block-css",     api: "css",        type: "dnr", ruleId: 1001, resourceTypes: ["stylesheet"] },
    { id: "block-fonts",   api: "fonts",      type: "dnr", ruleId: 1002, resourceTypes: ["font"] },
    { id: "block-popups",  api: "popups",     type: "contentSettings" },
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

    let blockedCount = 0;
    const activeApis = [];
    for (const s of SETTINGS) {
        const { id, api, type, ruleId } = s;
        const cb = document.getElementById(id);
        if (!cb) continue;

        try {
            if (type === "contentSettings") {
                const result = await chrome.contentSettings[api].get({ primaryUrl: _currentUrl });
                const blocked = result.setting === "block";
                cb.checked = blocked;
                if (blocked) { blockedCount++; activeApis.push(api); }
            } else if (type === "dnr") {
                const rules = await chrome.declarativeNetRequest.getSessionRules();
                const hostname = new URL(_currentUrl).hostname;
                const rule = rules.find(r => r.id === ruleId && r.condition.initiatorDomains?.includes(hostname));
                const blocked = !!rule;
                cb.checked = blocked;
                if (blocked) { blockedCount++; activeApis.push(api); }
            }
        } catch { cb.checked = false; }
    }

    if (shieldBtn) {
        shieldBtn.classList.toggle("active", blockedCount > 0);
        shieldBtn.title = blockedCount > 0 ? `Shield Active (${blockedCount} policies)` : "Shield (All Allowed)";
    }
    
    const status = document.getElementById("block-status");
    if (status && !status.classList.contains("saving")) {
        if (blockedCount > 0) {
            // Estimate number of elements blocked by fetching raw HTML
            let elemCount = 0;
            try {
                const html = await fetch(_currentUrl).then(r => r.text());
                if (activeApis.includes("images")) {
                    elemCount += (html.match(/<img/gi) || []).length;
                    elemCount += (html.match(/<picture/gi) || []).length;
                }
                if (activeApis.includes("javascript")) {
                    elemCount += (html.match(/<script/gi) || []).length;
                }
                if (activeApis.includes("css")) {
                    elemCount += (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;
                    elemCount += (html.match(/<style/gi) || []).length;
                }
                if (activeApis.includes("fonts")) {
                    elemCount += (html.match(/@font-face/gi) || []).length;
                    // generic fallback estimate for linked fonts
                    elemCount += 2; 
                }
                if (activeApis.includes("cookies")) {
                    elemCount += 5; // Abstract estimate for cookie calls
                }
                if (activeApis.includes("popups")) {
                    elemCount += (html.match(/window\.open/gi) || []).length;
                }
                
                // Add a small multiplier for dynamically injected elements that the raw HTML doesn't show
                if (elemCount > 0) elemCount = Math.floor(elemCount * 1.5);
                if (elemCount === 0) elemCount = blockedCount * 3; // Fallback if parsing fails
            } catch {
                elemCount = blockedCount * 5; // Offline fallback
            }

            status.innerHTML = `<span style="color:var(--accent-red, #ff6b6b); font-weight:bold">~${elemCount} Items Blocked</span>`;
        } else {
            status.innerHTML = `<span style="color:var(--accent-green, #a9dc76)">All Allowed</span>`;
        }
    }
}

async function toggle(settingObj, checkbox) {
    const { api, type, ruleId, resourceTypes } = settingObj;
    const pattern = getPattern(_currentUrl);
    if (!pattern) return;

    const hostname = new URL(_currentUrl).hostname;
    const status = document.getElementById("block-status");
    const reloadBtn = document.getElementById("block-reload");

    try {
        if (status) { status.textContent = "Saving…"; status.classList.add("saving"); }

        if (type === "contentSettings") {
            const setting = checkbox.checked ? "block" : "allow";
            await chrome.contentSettings[api].set({ primaryPattern: pattern, setting });
        } else if (type === "dnr") {
            const rules = await chrome.declarativeNetRequest.getSessionRules();
            const existing = rules.find(r => r.id === ruleId);
            const domains = new Set(existing?.condition?.initiatorDomains || []);

            if (checkbox.checked) {
                domains.add(hostname);
            } else {
                domains.delete(hostname);
            }

            if (domains.size > 0) {
                await chrome.declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [ruleId],
                    addRules: [{
                        id: ruleId,
                        priority: 1,
                        action: { type: "block" },
                        condition: {
                            resourceTypes: resourceTypes,
                            initiatorDomains: Array.from(domains)
                        }
                    }]
                });
            } else {
                await chrome.declarativeNetRequest.updateSessionRules({
                    removeRuleIds: [ruleId]
                });
            }
        }

        if (status) { status.classList.remove("saving"); }
        // Show reload button
        reloadBtn?.classList.add("show");
    } catch {
        if (status) { status.textContent = "Error"; status.classList.remove("saving"); }
        checkbox.checked = !checkbox.checked;
    }

    // Recalculate and update the UI counters/shield state
    await syncState();
}

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

    // On init: if autoHideBlocker is OFF, show the panel immediately
    chrome.storage.local.get("wh_config").then(data => {
        const config = data["wh_config"] || {};
        const autoHide = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
        if (!autoHide) {
            panel?.classList.add("visible");
            setTimeout(() => refitTerminal(), 280);
        }
    }).catch(() => {});

    let isPinned = false;

    // Shield button always toggles the panel
    shieldBtn?.addEventListener("click", () => {
        panel?.classList.toggle("visible");
        setTimeout(() => refitTerminal(), 280);

        if (blockHideTimeout) clearTimeout(blockHideTimeout);

        // If panel is now open AND autoHide is ON, schedule auto-hide
        if (panel?.classList.contains("visible") && !isPinned) {
            chrome.storage.local.get("wh_config").then(data => {
                const config = data["wh_config"] || {};
                const autoHide = config["autoHideBlocker"] !== undefined ? config["autoHideBlocker"] : true;
                const delay = config["autoHideDelay"] || 15000; // Increased delay
                if (autoHide) scheduleAutoHide(delay);
            }).catch(() => {});
        }
    });

    // Double click to pin/unpin
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

    // React immediately when the config changes from the menu
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes["wh_config"]) {
            const oldVal = changes["wh_config"].oldValue?.["autoHideBlocker"];
            const newVal = changes["wh_config"].newValue?.["autoHideBlocker"];
            if (oldVal !== newVal && newVal !== undefined) {
                if (blockHideTimeout) clearTimeout(blockHideTimeout);
                if (!newVal || isPinned) {
                    // OFF or Pinned → show panel immediately and keep it
                    panel?.classList.add("visible");
                    setTimeout(() => refitTerminal(), 280);
                } else {
                    // ON → if panel is open, start auto-hide countdown
                    if (panel?.classList.contains("visible")) {
                        const delay = changes["wh_config"].newValue?.["autoHideDelay"] || 15000;
                        scheduleAutoHide(delay);
                    }
                }
            }
        }
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

    for (const s of SETTINGS) {
        const cb = document.getElementById(s.id);
        cb?.addEventListener("change", () => toggle(s, cb));
    }

    chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
        try {
            _activeTabId = activeInfo.tabId;
            const tab = await chrome.tabs.get(activeInfo.tabId);
            _currentUrl = tab.url;
            await syncState();

            // Auto hide block panel on tab switch (unless pinned)
            const panel = document.getElementById("block-panel");
            if (panel && panel.classList.contains("visible") && !isPinned) {
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
