/**
 * @module modules/terminal/modal/modal-core.js
 * @description Shared modal infrastructure: DOM references, open/close, dismiss handlers.
 *
 * @connections
 * - Imports: None
 * - Exports: getModalEls, openModal, closeModal
 * - Layer: Terminal Layer (UI)
 */

// ---------------------------------------------------------------------------
// DOM element accessors (lazy, safe for side-panel lifecycle)
// ---------------------------------------------------------------------------

export function getModalEls() {
    return {
        overlay:  document.getElementById("wh-modal-overlay"),
        title:    document.getElementById("wh-modal-title"),
        body:     document.getElementById("wh-modal-body"),
        footer:   document.getElementById("wh-modal-footer"),
        closeBtn: document.getElementById("wh-modal-close"),
    };
}

// ---------------------------------------------------------------------------
// Promise resolver — shared across all modal types
// ---------------------------------------------------------------------------

let _resolve = null;

/**
 * Open the modal overlay, wire dismiss handlers (Escape, backdrop click, ✕),
 * and return a Promise that resolves when closeModal() is called.
 *
 * @param {HTMLElement} els - Result of getModalEls()
 * @param {*} cancelValue - Value to resolve with on dismiss (null or false)
 * @param {HTMLElement} [focusTarget] - Element to auto-focus after open
 * @returns {Promise<*>}
 */
export function openModal(els, cancelValue, focusTarget) {
    const { overlay, closeBtn } = els;

    // Wire ✕ button
    if (closeBtn) closeBtn.onclick = () => closeModal(cancelValue);

    // Backdrop click
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal(cancelValue);
    };

    // Escape key (single-use listener per open)
    const escHandler = (e) => {
        if (e.key === "Escape") {
            closeModal(cancelValue);
            document.removeEventListener("keydown", escHandler);
        }
    };
    document.addEventListener("keydown", escHandler);

    // Show
    overlay.classList.add("open");

    // Auto-focus
    if (focusTarget) setTimeout(() => focusTarget.focus(), 100);

    return new Promise(resolve => { _resolve = resolve; });
}

/**
 * Close the modal and resolve the pending Promise.
 * @param {*} result - The value to resolve with
 */
export function closeModal(result) {
    const o = document.getElementById("wh-modal-overlay");
    if (o) o.classList.remove("open");
    if (_resolve) {
        _resolve(result);
        _resolve = null;
    }
}
