/**
 * WhatHappened — Shared State
 *
 * Holds the commandOutputHistory array shared between terminal.js (writer)
 * and commands/native.js cmdExport (reader).
 *
 * Uses chrome.storage.session to persist state across side panel close/reopen.
 * Call `exit` command to explicitly clear the session.
 */

let commandOutputHistory = [];
let _lastTarget = null;
let _triad = { registrar: null, ns: null, host: null };

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function pushHistory(entry) {
    commandOutputHistory.push(entry);
    if (commandOutputHistory.length > 500) {
        commandOutputHistory = commandOutputHistory.slice(-500);
    }
    _persistSession();
}

export function getHistory() {
    return commandOutputHistory;
}

// ---------------------------------------------------------------------------
// Session persistence (chrome.storage.session)
// ---------------------------------------------------------------------------

export function setSessionTarget(domain) {
    _lastTarget = domain;
    _persistSession();
}

export function setSessionTriad(key, value) {
    if (key in _triad) {
        _triad[key] = value;
        _persistSession();
    }
}

export function getSessionTarget() {
    return _lastTarget;
}

function _persistSession() {
    try {
        chrome.storage.session.set({
            wh_history: commandOutputHistory,
            wh_target: _lastTarget,
            wh_triad: _triad,
        });
    } catch (_) {}
}

export async function restoreSession() {
    try {
        const data = await chrome.storage.session.get(["wh_history", "wh_target", "wh_triad"]);
        if (data.wh_history?.length) {
            commandOutputHistory = data.wh_history;
        }
        if (data.wh_target) {
            _lastTarget = data.wh_target;
        }
        if (data.wh_triad) {
            _triad = { ..._triad, ...data.wh_triad };
        }
        return { history: commandOutputHistory, target: _lastTarget, triad: _triad };
    } catch (_) {
        return { history: [], target: null, triad: { registrar: null, ns: null, host: null } };
    }
}

export async function clearSession() {
    commandOutputHistory = [];
    _lastTarget = null;
    _triad = { registrar: null, ns: null, host: null };
    try {
        await chrome.storage.session.remove(["wh_history", "wh_target", "wh_triad"]);
    } catch (_) {}
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
