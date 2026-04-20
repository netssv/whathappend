/**
 * WhatHappened — Shared State
 *
 * Holds the commandOutputHistory array shared between terminal.js (writer)
 * and commands/native.js cmdExport (reader).
 *
 * Also tracks terminal dimensions for responsive layout.
 */

export let commandOutputHistory = [];

export function pushHistory(entry) {
    commandOutputHistory.push(entry);
    // Cap at 500 entries
    if (commandOutputHistory.length > 500) {
        commandOutputHistory = commandOutputHistory.slice(-500);
    }
}

export function getHistory() {
    return commandOutputHistory;
}

// ---------------------------------------------------------------------------
// Terminal Dimensions — updated by terminal.js on resize
// ---------------------------------------------------------------------------

let _termCols = 80;

export function setTermCols(cols) {
    _termCols = cols || 80;
}

export function getTermCols() {
    return _termCols;
}
