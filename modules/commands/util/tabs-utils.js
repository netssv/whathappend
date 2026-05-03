/**
 * @module modules/commands/util/tabs-utils.js
 * @description Shared pure-utility helpers for all tabs-* modules.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: icon, truncate
 * - Layer: Command Layer (Util) — zero side-effects, no Chrome API calls.
 */

import { ANSI } from "../../formatter.js";

/**
 * Returns a single-character colored status icon for a tab.
 * @param {chrome.tabs.Tab} tab
 * @returns {string}
 */
export function icon(tab) {
    if (tab.active)                 return `${ANSI.green}●${ANSI.reset}`;
    if (tab.audible)                return `${ANSI.green}♪${ANSI.reset}`;
    if (tab.status === "loading")   return `${ANSI.cyan}◌${ANSI.reset}`;
    if (tab.discarded)              return `${ANSI.yellow}z${ANSI.reset}`;
    return `${ANSI.dim}Z${ANSI.reset}`;
}

/**
 * Truncates a string to maxLen, appending "…" if needed.
 * @param {string} str
 * @param {number} [maxLen=30]
 * @returns {string}
 */
export function truncate(str, maxLen = 30) {
    if (!str) return "Untitled";
    return str.length > maxLen ? str.substring(0, maxLen - 1) + "…" : str;
}
