// ===================================================================
// Write Lock — Mutex for terminal ANSI cursor manipulation
//
// Prevents cursor corruption when the ProgressiveRenderer updates
// skeleton rows while the user is typing. Each _overwriteLine() call
// acquires/releases within a single synchronous block — user input
// is delayed by microseconds, not blocked for the entire triage.
// ===================================================================

let _locked = false;
const _queue = [];

/**
 * Acquire the write lock before ANSI cursor manipulation.
 * Must be paired with releaseWriteLock() in the same synchronous block.
 */
export function acquireWriteLock() {
    _locked = true;
}

/**
 * Release the write lock and flush any queued user writes.
 * Queued operations execute synchronously in FIFO order.
 */
export function releaseWriteLock() {
    _locked = false;
    while (_queue.length > 0) {
        const fn = _queue.shift();
        fn();
    }
}

/**
 * Check if a cursor manipulation is in progress.
 * @returns {boolean}
 */
export function isWriteLocked() {
    return _locked;
}

/**
 * Enqueue a write operation to execute after the lock releases.
 * Used by keyboard-events.js to buffer user input during updates.
 * @param {Function} fn — deferred write callback
 */
export function enqueueWrite(fn) {
    _queue.push(fn);
}
