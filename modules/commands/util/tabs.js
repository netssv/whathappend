/**
 * @module modules/commands/util/tabs.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - tabInfo from './tabs-info.js'
 *     - tabDiag from './tabs-diag.js'
 *     - createTabWatcher from './tabs-watch.js'
 *     - tabBlock from './tabs-block.js'
 * - Exports: cmdTabs
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { tabInfo } from "./tabs-info.js";
import { tabDiag } from "./tabs-diag.js";
import { createTabWatcher } from "./tabs-watch.js";
import { tabBlock } from "./tabs-block.js";

// tabs — Unified tab manager (list, close, info, diag, watch, block, sleep, focus)

let _indexMap = [];  // Maps short index → real chrome tab ID

function icon(tab) {
    if (tab.active) return `${ANSI.green}●${ANSI.reset}`;
    if (tab.audible) return `${ANSI.green}♪${ANSI.reset}`;
    if (tab.status === "loading") return `${ANSI.cyan}◌${ANSI.reset}`;
    if (tab.discarded) return `${ANSI.yellow}z${ANSI.reset}`;
    return `${ANSI.dim}Z${ANSI.reset}`;
}

async function buildIndexMap() {
    const tabs = await chrome.tabs.query({});
    _indexMap = [];
    let idx = 1;
    for (const tab of tabs) { _indexMap[idx++] = tab.id; }
}

async function resolveTabId(input) {
    const n = parseInt(input, 10);
    if (isNaN(n)) return null;
    // Auto-build map if not populated yet
    if (_indexMap.length === 0) await buildIndexMap();
    // If it looks like a short index (1-999), resolve from cache
    if (n < 1000 && _indexMap[n] !== undefined) return _indexMap[n];
    // Otherwise treat as raw Chrome tab ID
    return n;
}

export async function cmdTabs(args) {
    const sub = args[0]?.toLowerCase();

    // ── LIST ─────────────────────────────────────────────────────
    if (!sub || sub === "list") {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs?.length) {
                    resolve(`${ANSI.red}[ERROR] No tabs found.${ANSI.reset}`);
                    return;
                }

                // Build index map and group by host
                _indexMap = [];
                const groups = new Map();
                let idx = 1;

                for (const tab of tabs) {
                    _indexMap[idx] = tab.id;
                    tab._idx = idx++;
                    let host = "";
                    try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                    if (!groups.has(host)) groups.set(host, []);
                    groups.get(host).push(tab);
                }

                let o = `\n${ANSI.cyan}${ANSI.bold}  Tabs${ANSI.reset} ${ANSI.dim}${tabs.length} open · ${groups.size} sites${ANSI.reset}\n`;

                for (const [host, hostTabs] of groups) {
                    const count = hostTabs.length > 1 ? ` ${ANSI.dim}(${hostTabs.length})${ANSI.reset}` : "";
                    o += `\n  ${ANSI.cyan}${host}${ANSI.reset}${count}\n`;

                    for (const tab of hostTabs) {
                        const num = `${ANSI.dim}${String(tab._idx).padStart(2)}${ANSI.reset}`;
                        let title = tab.title || "Untitled";
                        if (title.length > 28) title = title.substring(0, 27) + "…";
                        o += `  ${num} ${icon(tab)} ${title}\n`;
                    }
                }

                o += `\n${ANSI.dim}  ${ANSI.green}●${ANSI.dim}active ${ANSI.reset}${ANSI.dim}Z${ANSI.dim}idle ${ANSI.yellow}z${ANSI.dim}sleep ${ANSI.green}♪${ANSI.dim}audio ${ANSI.cyan}◌${ANSI.dim}loading${ANSI.reset}\n`;
                o += `${ANSI.dim}  close · info · diag · watch · block · sleep · focus${ANSI.reset}\n`;
                resolve(o);
            });
        });
    }

    // ── CLOSE ────────────────────────────────────────────────────
    if (sub === "close") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs close <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        const confirmed = args[2]?.toLowerCase() === "yes";

        try {
            const tab = await chrome.tabs.get(tabId);
            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";

            if (!confirmed) {
                let o = `\n${ANSI.yellow}[CONFIRM]${ANSI.reset} Close this tab?\n`;
                o += `  ${ANSI.white}${title}${ANSI.reset}\n`;
                o += `  ${ANSI.dim}${tab.url}${ANSI.reset}\n`;
                o += `\n${ANSI.dim}Run ${ANSI.white}tabs close ${args[1]} yes${ANSI.dim} to confirm.${ANSI.reset}`;
                return o;
            }

            return new Promise((resolve) => {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) {
                        resolve(`${ANSI.red}[ERROR] ${chrome.runtime.lastError.message}${ANSI.reset}`);
                    } else {
                        resolve(`${ANSI.green}[OK]${ANSI.reset} Closed: ${title}`);
                    }
                });
            });
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── INFO ─────────────────────────────────────────────────────
    if (sub === "info") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs info <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabInfo(tabId, args[1]);
    }

    // ── SLEEP (discard tab to free memory) ───────────────────────
    if (sub === "sleep" || sub === "discard") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs sleep <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            if (tab.active) return `${ANSI.yellow}[WARN]${ANSI.reset} Cannot sleep the active tab.`;
            if (tab.discarded) return `${ANSI.dim}Tab is already sleeping.${ANSI.reset}`;

            await chrome.tabs.discard(tabId);
            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";
            return `${ANSI.green}[OK]${ANSI.reset} ${title} ${ANSI.dim}→ sleeping${ANSI.reset}`;
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── FOCUS (switch browser to this tab) ───────────────────────
    if (sub === "focus" || sub === "goto" || sub === "switch") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs focus <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            await chrome.tabs.update(tabId, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });

            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";
            return `${ANSI.green}[OK]${ANSI.reset} Focused: ${title}`;
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── DIAG (inject health-check into the tab) ─────────────────
    if (sub === "diag" || sub === "health" || sub === "check") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs diag <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabDiag(tabId, args[1]);
    }

    // ── WATCH (live monitor) ─────────────────────────────────────
    if (sub === "watch" || sub === "monitor" || sub === "top") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs watch <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            await chrome.tabs.get(tabId); // validate tab exists
            const watcher = createTabWatcher(tabId, args[1]);
            return { __watch: true, watcher };
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── BLOCK (toggle JS, images, popups) ─────────────────────
    if (sub === "block" || sub === "unblock") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs block <#> [js|images|popups|all|none]${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabBlock(tabId, args[1], args.slice(2));
    }

    return `${ANSI.red}Try: tabs · close · info · diag · watch · block · sleep · focus${ANSI.reset}`;
}
