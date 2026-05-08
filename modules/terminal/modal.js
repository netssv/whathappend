/**
 * @module modules/terminal/modal.js
 * @description Barrel re-export for the modal system.
 *
 * This file acts as the public API surface. Consumers import from here;
 * internals are split across:
 *   - modal/modal-core.js    — DOM refs, open/close lifecycle
 *   - modal/modal-form.js    — Multi-field input dialog (showModal)
 *   - modal/modal-confirm.js — Simple Yes/No dialog (showConfirm)
 *
 * @connections
 * - Exports: showModal, showConfirm, closeModal
 * - Layer: Terminal Layer (UI)
 */

export { showModal }      from "./modal/modal-form.js";
export { showConfirm, showChoice } from "./modal/modal-confirm.js";
export { closeModal }     from "./modal/modal-core.js";
