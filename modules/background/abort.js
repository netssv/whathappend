// ===================================================================
// Abort Controller Registry — Enables Ctrl+C cancellation
// ===================================================================

const _activeAborts = new Map();
export let _abortSeq = 0;

export function getNextAbortSeq() {
    return ++_abortSeq;
}

export function createAbort(id, timeoutMs = 15000) {
    // Cancel any existing abort with same id
    cancelAbort(id);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    _activeAborts.set(id, { ctrl, timer });
    return ctrl.signal;
}

export function cancelAbort(id) {
    const entry = _activeAborts.get(id);
    if (entry) {
        clearTimeout(entry.timer);
        entry.ctrl.abort();
        _activeAborts.delete(id);
    }
}

export function completeAbort(id) {
    const entry = _activeAborts.get(id);
    if (entry) {
        clearTimeout(entry.timer);
        _activeAborts.delete(id);
    }
}
