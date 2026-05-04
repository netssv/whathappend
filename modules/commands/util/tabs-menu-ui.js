/**
 * @module modules/commands/util/tabs-menu-ui.js
 * @description Rendering functions for the Tabs TUI menu.
 *              Pure output generators — no state mutation, no Chrome API.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', icon/truncate from './tabs-utils.js'
 * - Exports: renderTabList, renderActionMenu, ACTION_MENU_ITEMS, MODE_KEYS
 * - Layer: Command Layer (Util) — stateless view helpers.
 */

import { ANSI } from "../../formatter.js";
import { icon, truncate } from "./tabs-utils.js";

// ── Constants ────────────────────────────────────────────────────────

/** @typedef {"focus"|"close"|"info"|"diag"|"watch"|"block"|"sleep"|"flush"} TabMode */

/**
 * Keyboard letter → mode mapping.
 * Used by the controller to resolve user input into an action.
 */
export const MODE_KEYS = {
    f: "focus", c: "close", i: "info", d: "diag",
    w: "watch", b: "block", s: "sleep", x: "flush",
};

/** Ordered action items shown in Level 2 (action selection). */
const ACTION_MENU_ITEMS = [
    { key: "F", mode: "focus", label: "Focus (Switch to tab)" },
    { key: "C", mode: "close", label: "Close (Kill tab)" },
    { key: "I", mode: "info",  label: "Info  (Metadata)" },
    { key: "D", mode: "diag",  label: "Diag  (Health)" },
    { key: "W", mode: "watch", label: "Watch (Live network)" },
    { key: "B", mode: "block", label: "Block (Network access)" },
    { key: "S", mode: "sleep", label: "Sleep (Free memory)" },
    { key: "X", mode: "flush", label: "Flush (Clear Data)" },
];

// ── Rendering ────────────────────────────────────────────────────────

/**
 * Renders Level 1: Tab selection list.
 * @param {chrome.tabs.Tab[]} tabs
 * @param {string} message - Optional status message to display.
 * @returns {string} ANSI-formatted output string.
 */
export function renderTabList(tabs, message) {
    let out = `\n  ${ANSI.bold}${ANSI.cyan}/// TAB MANAGER ///${ANSI.reset}  ${ANSI.dim}${tabs.length} open${ANSI.reset}\n\n`;

    const max = Math.min(tabs.length, 9);
    for (let i = 0; i < max; i++) {
        out += `    ${ANSI.bold}[${i + 1}]${ANSI.reset} ${icon(tabs[i])} ${truncate(tabs[i].title, 40)}\n`;
    }

    if (tabs.length > 9) {
        out += `    ${ANSI.dim}...and ${tabs.length - 9} more tabs.${ANSI.reset}\n`;
    }

    out += message ? `\n  ${ANSI.yellow}${message}${ANSI.reset}\n` : `\n`;
    out += `  ${ANSI.bold}Select Target:${ANSI.reset} Press ${ANSI.cyan}1-${max}${ANSI.reset} to manage a tab.\n`;
    out += `  ${ANSI.dim}'Q' to quit.${ANSI.reset}\n`;

    return out;
}

/**
 * Renders Level 2: Action menu for a selected tab.
 * @param {chrome.tabs.Tab} tab
 * @param {string} message - Optional status message.
 * @returns {string} ANSI-formatted output string.
 */
export function renderActionMenu(tab, message) {
    let out = `\n  ${ANSI.bold}${ANSI.cyan}/// MANAGE TAB ///${ANSI.reset}\n\n`;
    out += `  ${ANSI.bold}Target:${ANSI.reset} ${icon(tab)} ${truncate(tab.title, 50)}\n`;
    out += `  ${ANSI.dim}URL: ${truncate(tab.url || "about:blank", 55)}${ANSI.reset}\n\n`;

    out += `  ${ANSI.bold}Select Action:${ANSI.reset}\n`;
    for (const item of ACTION_MENU_ITEMS) {
        out += `    ${ANSI.bold}${ANSI.yellow}[${item.key}]${ANSI.reset} ${item.label}\n`;
    }
    out += `\n`;

    if (message) out += `  ${ANSI.yellow}${message}${ANSI.reset}\n`;
    out += `  ${ANSI.dim}Press letter to execute. 'B' to go back, 'Q' to quit.${ANSI.reset}\n`;

    return out;
}
