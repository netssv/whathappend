/**
 * @module modules/commands/util/core/ua-engine.js
 * @description Shared engine for useragent and mobile commands.
 *              Uses chrome.debugger to spoof the UA and reload the tab.
 */

import { ANSI } from "../../../formatter.js";
import { setEmulation, clearEmulation } from "../../../terminal/header/header-emulation.js";

/**
 * List all open tabs as indexed options (reusing the same tab-listing pattern as tabs.js).
 * Returns { lines: string[], indexMap: {[n]: tabId} }
 */
export async function listTabOptions() {
    const tabs = await chrome.tabs.query({});
    const indexMap = {};
    const lines = [];
    let idx = 1;

    for (const tab of tabs) {
        let host = "";
        try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
        let title = tab.title || host || "Untitled";
        if (title.length > 34) title = title.substring(0, 33) + "…";
        const activeFlag = tab.active ? ` ${ANSI.green}●${ANSI.reset}` : "";
        lines.push(`  ${ANSI.dim}${String(idx).padStart(2)}${ANSI.reset}  ${title}${activeFlag}  ${ANSI.dim}${host}${ANSI.reset}`);
        indexMap[idx] = tab.id;
        idx++;
    }
    return { lines, indexMap };
}

/**
 * Apply a User Agent override to a tab via chrome.debugger, then reload.
 * Returns a formatted result string.
 */
export async function applyUAToTab(tabId, ua, label) {
    const target = { tabId };

    try {
        // Attach debugger
        await chrome.debugger.attach(target, "1.3");
    } catch (err) {
        // Already attached is OK, otherwise fail
        if (!err.message?.includes("already attached")) {
            return `${ANSI.red}[ERROR] Could not attach debugger: ${err.message}${ANSI.reset}\n${ANSI.dim}Tip: Close DevTools on that tab first.${ANSI.reset}`;
        }
    }

    try {
        // Set User Agent override via Network domain
        await chrome.debugger.sendCommand(target, "Network.setUserAgentOverride", { userAgent: ua });

        // Reload the tab to apply the new UA
        await chrome.tabs.reload(tabId, { bypassCache: true });

        const tab = await chrome.tabs.get(tabId);
        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = tab.url; }

        let o = `\n${ANSI.green}[OK]${ANSI.reset} User Agent applied & tab reloaded\n`;
        o += `  ${ANSI.dim}Tab   ${ANSI.reset}${host}\n`;
        o += `  ${ANSI.dim}UA    ${ANSI.reset}${ANSI.cyan}${label}${ANSI.reset}\n`;
        o += `\n${ANSI.dim}UA override is active until the tab is closed or DevTools detaches.${ANSI.reset}\n`;
        o += `${ANSI.dim}Run ${ANSI.white}ua reset${ANSI.dim} to restore the default.${ANSI.reset}`;
        return o;
    } catch (err) {
        try { await chrome.debugger.detach(target); } catch (_) {}
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}

/**
 * Detach the debugger from a tab (restore UA).
 */
export async function resetUA(tabId) {
    try {
        await chrome.debugger.detach({ tabId });
        await chrome.tabs.reload(tabId, { bypassCache: true });
        clearEmulation("ua");
        clearEmulation("mobile");
        return `${ANSI.green}[OK]${ANSI.reset} UA reset to default. Tab reloaded.`;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}

/**
 * Get the currently active tab's ID.
 */
export async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
}
