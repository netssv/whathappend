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

import { ANSI, stripAnsi } from "../../formatter.js";
import { icon, truncate } from "./tabs-utils.js";
import { getTermCols } from "../../state.js";

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
export function renderTabList(tabs, message, writeLine) {
    writeLine(`  ${ANSI.bold}${ANSI.cyan}/// TAB MANAGER ///${ANSI.reset}  ${ANSI.dim}${tabs.length} open${ANSI.reset}`);
    writeLine("");

    const max = Math.min(tabs.length, 9);
    for (let i = 0; i < max; i++) {
        const val = (i + 1).toString();
        const text = `    ${ANSI.bold}[${val}]${ANSI.reset} ${icon(tabs[i])} ${truncate(tabs[i].title, 40)}`;
        writeLine(text, val);
    }

    if (tabs.length > 9) {
        writeLine(`    ${ANSI.dim}...and ${tabs.length - 9} more tabs.${ANSI.reset}`);
    }

    if (message) {
        writeLine("");
        writeLine(`  ${ANSI.yellow}${message}${ANSI.reset}`);
    }
    writeLine("");
    writeLine(`  ${ANSI.bold}Select Target:${ANSI.reset} Press ${ANSI.cyan}1-${max}${ANSI.reset} or click to manage a tab.`);
    writeLine(`  ${ANSI.dim}${ANSI.red}[Q]uit${ANSI.reset}`, "q");
}

/**
 * Renders Level 2: Action menu for a selected tab.
 * @param {chrome.tabs.Tab} tab
 * @param {string} message - Optional status message.
 * @returns {string} ANSI-formatted output string.
 */
export function renderActionMenu(tab, message, writeLine) {
    writeLine(`  ${ANSI.bold}${ANSI.cyan}/// MANAGE TAB ///${ANSI.reset}`);
    writeLine("");
    writeLine(`  ${ANSI.bold}Target:${ANSI.reset} ${icon(tab)} ${truncate(tab.title, 50)}`);
    writeLine(`  ${ANSI.dim}URL: ${truncate(tab.url || "about:blank", 55)}${ANSI.reset}`);
    writeLine("");

    writeLine(`  ${ANSI.bold}Select Action:${ANSI.reset}`);
    for (const item of ACTION_MENU_ITEMS) {
        const text = `    ${ANSI.bold}${ANSI.yellow}[${item.key}]${ANSI.reset} ${item.label}`;
        writeLine(text, item.key.toLowerCase());
    }
    writeLine("");

    if (message) {
        writeLine(`  ${ANSI.yellow}${message}${ANSI.reset}`);
    }
    const backQuitText = `  ${ANSI.dim}Press letter or click to execute. ${ANSI.yellow}[B]ack${ANSI.reset}  ${ANSI.red}[Q]uit${ANSI.reset}`;
    writeLine(backQuitText, "bq");
}

// ── Renderer Class ───────────────────────────────────────────────────

export class TabsMenuRenderer {
    constructor(term) {
        this.term = term;
        this.rowMap = {};
        this.hoveredAction = null;
        this.selectedTabIndex = null;
        this.tabsList = [];
    }

    draw(tabs, selectedTabIndex, message, hoveredAction = null) {
        this.tabsList = tabs;
        this.selectedTabIndex = selectedTabIndex;
        this.hoveredAction = hoveredAction;
        this.rowMap = {};
        
        let currentY = 1;
        const cols = getTermCols() || 80;
        let buffer = "\x1b[2J\x1b[3J\x1b[H\n";
        currentY++; // account for the \n

        const writeLine = (str, action = null) => {
            const stripped = stripAnsi(str);
            const len = stripped.length;
            let lines = Math.ceil(len / cols);
            if (lines === 0) lines = 1;
            
            if (action) {
                for (let i = 0; i < lines; i++) {
                    this.rowMap[currentY + i] = action;
                }
            }
            
            if (action && action === this.hoveredAction) {
                buffer += `\x1b[7m${str}\x1b[27m\r\n`;
            } else {
                buffer += `${str}\r\n`;
            }
            currentY += lines;
        };

        if (this.selectedTabIndex === null) {
            renderTabList(tabs, message, writeLine);
        } else {
            const tab = tabs[this.selectedTabIndex];
            if (tab) {
                renderActionMenu(tab, message, writeLine);
            }
        }

        this.term.write(buffer);
    }

    getActionAt(y, x) {
        const action = this.rowMap[y];
        if (!action) return null;
        if (action === "bq") {
            if (x < 50) return "b";
            return "q";
        }
        return action;
    }
}
