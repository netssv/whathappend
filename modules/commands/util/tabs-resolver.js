/**
 * @module modules/commands/util/tabs-resolver.js
 * @description Shared tab ID resolution. Translates short user-facing
 *              indices (1, 2, 3…) into real chrome.tabs IDs.
 *
 * @connections
 * - Imports: None (Chrome API only)
 * - Exports: buildIndexMap, resolveTabId, getIndexMap
 * - Layer: Command Layer (Util) — shared helper for all tabs-* modules.
 */

/** @type {number[]} Maps short display index → real chrome tab ID. */
let _indexMap = [];

/**
 * (Re)builds the index map from the current set of open tabs.
 * @returns {Promise<void>}
 */
export async function buildIndexMap() {
    const tabs = await chrome.tabs.query({});
    _indexMap = [];
    let idx = 1;
    for (const tab of tabs) { _indexMap[idx++] = tab.id; }
}

/**
 * Resolves a user-supplied string (short index OR raw tab ID) to a chrome tab ID.
 * @param {string} input
 * @returns {Promise<number|null>} Resolved tab ID, or null if invalid.
 */
export async function resolveTabId(input) {
    const n = parseInt(input, 10);
    if (isNaN(n)) return null;
    if (_indexMap.length === 0) await buildIndexMap();
    // Short display index (1-999) → resolve via map
    if (n < 1000 && _indexMap[n] !== undefined) return _indexMap[n];
    // Raw Chrome tab ID
    return n;
}

/**
 * Returns a snapshot of the current index map (read-only).
 * @returns {readonly number[]}
 */
export function getIndexMap() {
    return _indexMap;
}
