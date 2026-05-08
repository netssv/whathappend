/**
 * @module modules/terminal/modal/modal-confirm.js
 * @description Simple Yes/No confirmation dialog.
 *
 * @connections
 * - Imports: getModalEls, openModal, closeModal from './modal-core.js'
 *            sanitizeHTML, clearElement from './sanitize.js'
 * - Exports: showConfirm, showChoice
 * - Layer: Terminal Layer (UI)
 */

import { getModalEls, openModal, closeModal } from "./modal-core.js";
import { sanitizeHTML, clearElement } from "./sanitize.js";

/**
 * Show a confirmation dialog.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message - Body message (supports safe HTML subset)
 * @param {string} [opts.confirmLabel="Yes"]
 * @param {string} [opts.cancelLabel="Cancel"]
 * @param {boolean} [opts.danger=false] - If true, confirm button is styled red
 * @returns {Promise<boolean>} true if confirmed, false if cancelled
 */
export function showConfirm(opts) {
    const els = getModalEls();
    if (!els.overlay || !els.body || !els.footer) return Promise.resolve(false);

    // Title
    if (els.title) els.title.textContent = opts.title || "Confirm";

    // Message body — sanitized to prevent DOM XSS
    clearElement(els.body);
    const msg = document.createElement("div");
    msg.style.cssText = "font-size: 12.5px; color: #ccc; line-height: 1.6;";
    msg.innerHTML = sanitizeHTML(opts.message || "Are you sure?");
    els.body.appendChild(msg);

    // Footer buttons
    clearElement(els.footer);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "wh-modal-btn-cancel";
    cancelBtn.textContent = opts.cancelLabel || "Cancel";
    cancelBtn.addEventListener("click", () => closeModal(false));

    const confirmBtn = document.createElement("button");
    if (opts.danger) {
        confirmBtn.className = "wh-modal-btn-cancel";
        confirmBtn.style.cssText = "background: rgba(255,82,82,0.15); color: #ff5252; border-color: rgba(255,82,82,0.3) !important;";
    } else {
        confirmBtn.className = "wh-modal-btn-primary";
    }
    confirmBtn.textContent = opts.confirmLabel || "Yes";
    confirmBtn.addEventListener("click", () => closeModal(true));

    els.footer.appendChild(cancelBtn);
    els.footer.appendChild(confirmBtn);

    // Open and auto-focus confirm button
    return openModal(els, false, confirmBtn);
}

/**
 * Show a choice dialog with multiple buttons.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {Array} opts.choices - Array of { label, value, primary }
 * @returns {Promise<*>} value of selected choice or null if cancelled
 */
export function showChoice(opts) {
    const els = getModalEls();
    if (!els.overlay || !els.body || !els.footer) return Promise.resolve(null);

    if (els.title) els.title.textContent = opts.title || "Choose Option";

    // Message body — sanitized
    clearElement(els.body);
    const msg = document.createElement("div");
    msg.style.cssText = "font-size: 12.5px; color: #ccc; line-height: 1.6; margin-bottom: 12px;";
    msg.innerHTML = sanitizeHTML(opts.message || "");
    els.body.appendChild(msg);

    // Footer buttons
    clearElement(els.footer);
    
    // Add cancel button first
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "wh-modal-btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => closeModal(null));
    els.footer.appendChild(cancelBtn);

    let firstPrimary = null;
    for (const c of opts.choices) {
        const btn = document.createElement("button");
        btn.className = c.primary ? "wh-modal-btn-primary" : "wh-modal-btn-cancel";
        btn.textContent = c.label;
        btn.addEventListener("click", () => closeModal(c.value));
        els.footer.appendChild(btn);
        if (c.primary && !firstPrimary) firstPrimary = btn;
    }

    return openModal(els, null, firstPrimary || cancelBtn);
}

