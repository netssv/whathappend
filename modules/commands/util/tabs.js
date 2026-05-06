/**
 * @module modules/commands/util/tabs.js
 * @description Unified tab manager — slim command dispatcher.
 *
 * Sub-commands are handled by dedicated modules:
 *   tabs-menu.js     → interactive TUI (no args)
 *   tabs-list.js     → `tabs list`
 *   tabs-info.js     → `tabs info <#>`
 *   tabs-diag.js     → `tabs diag <#>`
 *   tabs-watch.js    → `tabs watch <#>`
 *   tabs-block.js    → `tabs block <#> [...]`
 *   tabs-resolver.js → shared index-map (buildIndexMap, resolveTabId)
 *   tabs-utils.js    → shared helpers (icon, truncate)
 *
 * @connections
 * - Imports: ANSI, tabList, tabInfo, tabDiag, createTabWatcher,
 *            tabBlock, resolveTabId, createTabMenu
 * - Exports: cmdTabs
 * - Layer: Command Layer (Util) — orchestrator only, no business logic.
 */

import { ANSI }            from "../../formatter.js";
import { tabList }         from "./tabs-list.js";
import { tabInfo }         from "./tabs-info.js";
import { tabDiag }         from "./tabs-diag.js";
import { createTabWatcher }from "./tabs-watch.js";
import { tabBlock }        from "./tabs-block.js";
import { resolveTabId }    from "./tabs-resolver.js";
import { createTabMenu }   from "./tabs-menu.js";

const USAGE = `${ANSI.red}Try: tabs · list · close · info · diag · watch · block · sleep · focus · flush${ANSI.reset}`;

/**
 * Main entry point for the `tabs` command family.
 * @param {string[]} args
 * @param {string[]} flags
 * @returns {Promise<string|{__watch:true, watcher:object}>}
 */
export async function cmdTabs(args, flags = []) {
    let sub = "";
    let tabArg = "";

    if (flags.length > 0 && flags[0].startsWith("-")) {
        sub = flags[0].replace(/^-+/, "").toLowerCase();
        tabArg = args[0];
    } else {
        sub = args[0]?.toLowerCase();
        tabArg = args[1];
    }

    // ── INTERACTIVE MENU (no sub-command) ────────────────────────
    if (!sub) return createTabMenu(cmdTabs);

    // ── LIST ─────────────────────────────────────────────────────
    if (sub === "list") return await tabList();

    // ── CLOSE ────────────────────────────────────────────────────
    if (sub === "close") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -close <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            const title = truncateTitle(tab.title);
            const { showConfirm } = await import("../../terminal/modal.js");
            const confirmed = await showConfirm({
                title: "❌ Close Tab",
                message: `Close tab <strong style="color:#ffd740">${title}</strong>?<br><span style="color:#888">${tab.url}</span>`,
                confirmLabel: "Close", cancelLabel: "Cancel", danger: true,
            });
            if (!confirmed) return `${ANSI.dim}Cancelled.${ANSI.reset}`;
            return new Promise((resolve) => {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) resolve(`${ANSI.red}[ERROR] ${chrome.runtime.lastError.message}${ANSI.reset}`);
                    else resolve(`${ANSI.green}[OK]${ANSI.reset} Closed: ${title}`);
                });
            });
        } catch (err) { return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`; }
    }

    // ── INFO ─────────────────────────────────────────────────────
    if (sub === "info") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -info <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        return await tabInfo(tabId, tabArg);
    }

    // ── SLEEP ────────────────────────────────────────────────────
    if (sub === "sleep" || sub === "discard") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -sleep <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        try {
            const tab = await chrome.tabs.get(tabId);
            if (tab.active)    return `${ANSI.yellow}[WARN]${ANSI.reset} Cannot sleep the active tab.`;
            if (tab.discarded) return `${ANSI.dim}Tab is already sleeping.${ANSI.reset}`;
            await chrome.tabs.discard(tabId);
            return `${ANSI.green}[OK]${ANSI.reset} ${truncateTitle(tab.title)} ${ANSI.dim}→ sleeping${ANSI.reset}`;
        } catch (err) { return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`; }
    }

    // ── FOCUS ────────────────────────────────────────────────────
    if (sub === "focus" || sub === "goto" || sub === "switch") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -focus <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        try {
            const tab = await chrome.tabs.get(tabId);
            await chrome.tabs.update(tabId, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });
            return `${ANSI.green}[OK]${ANSI.reset} Focused: ${truncateTitle(tab.title)}`;
        } catch (err) { return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`; }
    }

    // ── DIAG ─────────────────────────────────────────────────────
    if (sub === "diag" || sub === "health" || sub === "check") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -diag <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        return await tabDiag(tabId, tabArg);
    }

    // ── WATCH ────────────────────────────────────────────────────
    if (sub === "watch" || sub === "monitor" || sub === "top") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -watch <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        try {
            await chrome.tabs.get(tabId); // validate exists
            return { __watch: true, watcher: createTabWatcher(tabId, tabArg) };
        } catch (err) { return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`; }
    }

    // ── BLOCK ────────────────────────────────────────────────────
    if (sub === "block" || sub === "unblock") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -block <#> [js|images|popups|all|none]${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        return await tabBlock(tabId, tabArg, args.slice(1));
    }

    // ── FLUSH ────────────────────────────────────────────────────
    if (sub === "flush" || sub === "clear") {
        if (!tabArg) return `${ANSI.red}Usage: tabs -flush <#>${ANSI.reset}`;
        const tabId = await resolveTabId(tabArg);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${tabArg}${ANSI.reset}`;
        
        try {
            const tab = await chrome.tabs.get(tabId);
            if (!tab.url || tab.url.startsWith("chrome://")) {
                return `${ANSI.red}[ERROR] Cannot flush data for chrome:// URLs${ANSI.reset}`;
            }
            const url = new URL(tab.url);
            const { cmdFlush } = await import("../web/flush.js");
            // cmdFlush handles the confirmation modal natively
            return await cmdFlush([url.hostname]);
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    return USAGE;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function truncateTitle(title, max = 30) {
    if (!title) return "Untitled";
    return title.length > max ? title.substring(0, max - 1) + "…" : title;
}
