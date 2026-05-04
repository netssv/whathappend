/**
 * @module modules/commands/util/tabs-menu-actions.js
 * @description Action handlers for the Tabs TUI menu.
 *              Each function receives context and returns a result indicating
 *              what the controller should do next (redraw, restart, delegate).
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: handleFocus, handleClose, handleDelegatedAction
 * - Layer: Command Layer (Util) — action executors, no terminal I/O.
 */

import { ANSI } from "../../formatter.js";

// ── Result Types ─────────────────────────────────────────────────────
// Actions return plain objects describing the outcome.
// The controller interprets these without the action needing term access.

/**
 * @typedef {Object} ActionResult
 * @property {"redraw"|"restart"|"delegate-watch"|"delegate-output"|"error"} type
 * @property {string}  [message]    - Status message for redraw
 * @property {object}  [watcher]    - Sub-watcher for delegate-watch
 * @property {string}  [output]     - Terminal output for delegate-output
 */

// ── Focus ────────────────────────────────────────────────────────────

/**
 * Focuses (switches to) a tab.
 * @param {chrome.tabs.Tab} tab
 * @param {string} label - Display label (e.g. "1")
 * @returns {Promise<ActionResult>}
 */
export async function handleFocus(tab, label) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return { type: "redraw", message: `Focused tab ${label}.` };
}

// ── Close (with confirmation modal) ──────────────────────────────────

/**
 * Closes a tab after user confirmation via the modal system.
 * @param {chrome.tabs.Tab} tab
 * @returns {Promise<ActionResult>}
 */
export async function handleClose(tab) {
    const { showConfirm } = await import("../../terminal/modal.js");

    const confirmed = await showConfirm({
        title: "⚠️ Close Tab",
        message: `Are you sure you want to close this tab?<br><br><span style="color:#fff">${tab.title}</span>`,
        confirmLabel: "Close Tab",
        danger: true,
    });

    if (confirmed) {
        await chrome.tabs.remove(tab.id);
    }

    // Either way, restart the menu from the top
    return { type: "restart" };
}

// ── Delegated Actions (info, diag, watch, block, sleep, flush) ──────

/**
 * Runs a sub-command via the tabs dispatcher.
 * @param {Function} cmdTabs - The tabs dispatcher function.
 * @param {string} mode      - Sub-command name (e.g. "info", "watch")
 * @param {string} label     - Tab index label (e.g. "1")
 * @returns {Promise<ActionResult>}
 */
export async function handleDelegatedAction(cmdTabs, mode, label) {
    try {
        const res = await cmdTabs([mode, label]);

        if (typeof res === "object" && res?.__watch) {
            return { type: "delegate-watch", watcher: res.watcher };
        }

        return { type: "delegate-output", output: `\n${res}\n` };
    } catch (err) {
        return { type: "error", output: `\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n` };
    }
}
