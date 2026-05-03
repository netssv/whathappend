/**
 * @module modules/terminal/modal/modal-form.js
 * @description Form-based modal dialog (multi-field input with validation).
 *
 * @connections
 * - Imports: getModalEls, openModal, closeModal from './modal-core.js'
 * - Exports: showModal
 * - Layer: Terminal Layer (UI)
 */

import { getModalEls, openModal, closeModal } from "./modal-core.js";

// ---------------------------------------------------------------------------
// Field renderer
// ---------------------------------------------------------------------------

function createField(f) {
    const frag = document.createDocumentFragment();

    const label = document.createElement("label");
    label.textContent = f.label || f.id;
    label.setAttribute("for", `wh-modal-field-${f.id}`);
    frag.appendChild(label);

    const input = document.createElement("input");
    input.type = f.type || "text";
    input.id = `wh-modal-field-${f.id}`;
    input.placeholder = f.placeholder || "";
    if (f.value) input.value = f.value;
    if (f.step) input.step = f.step;
    frag.appendChild(input);

    if (f.hint) {
        const hint = document.createElement("div");
        hint.className = "wh-modal-hint";
        hint.textContent = f.hint;
        frag.appendChild(hint);
    }

    return { el: frag, input };
}

// ---------------------------------------------------------------------------
// showModal — Form dialog with fields, validation, and row grouping
// ---------------------------------------------------------------------------

/**
 * Show a form modal and return a Promise with the field values.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {Array}  opts.fields - { id, label, type?, placeholder?, value?, row?, hint?, step? }
 * @param {string} [opts.submitLabel="OK"]
 * @param {string} [opts.cancelLabel="Cancel"]
 * @param {Function} [opts.validate] - fn(values) → error string or null
 * @returns {Promise<Object|null>} Field values or null if cancelled
 */
export function showModal(opts) {
    const els = getModalEls();
    if (!els.overlay || !els.body || !els.footer) return Promise.resolve(null);

    // Title
    if (els.title) els.title.textContent = opts.title || "Dialog";

    // Build form fields
    els.body.innerHTML = "";
    const fieldEls = {};

    // Group fields by row
    const rows = {};
    const standalone = [];
    for (const f of opts.fields) {
        if (f.row !== undefined) {
            if (!rows[f.row]) rows[f.row] = [];
            rows[f.row].push(f);
        } else {
            standalone.push(f);
        }
    }

    // Render standalone fields
    for (const f of standalone) {
        const { el, input } = createField(f);
        els.body.appendChild(el);
        fieldEls[f.id] = input;
    }

    // Render grouped rows
    for (const rowFields of Object.values(rows)) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "wh-modal-row";
        for (const f of rowFields) {
            const wrapper = document.createElement("div");
            const { el, input } = createField(f);
            wrapper.appendChild(el);
            rowDiv.appendChild(wrapper);
            fieldEls[f.id] = input;
        }
        els.body.appendChild(rowDiv);
    }

    // Error message area
    const errEl = document.createElement("div");
    errEl.className = "wh-modal-error";
    els.body.appendChild(errEl);

    // Footer buttons
    els.footer.innerHTML = "";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "wh-modal-btn-cancel";
    cancelBtn.textContent = opts.cancelLabel || "Cancel";
    cancelBtn.addEventListener("click", () => closeModal(null));

    const submitBtn = document.createElement("button");
    submitBtn.className = "wh-modal-btn-primary";
    submitBtn.textContent = opts.submitLabel || "OK";
    submitBtn.addEventListener("click", () => {
        const values = {};
        for (const [id, input] of Object.entries(fieldEls)) {
            values[id] = input.value.trim();
        }
        if (opts.validate) {
            const error = opts.validate(values);
            if (error) {
                errEl.textContent = error;
                errEl.style.display = "block";
                return;
            }
        }
        closeModal(values);
    });

    els.footer.appendChild(cancelBtn);
    els.footer.appendChild(submitBtn);

    // Enter key submits form
    els.body.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submitBtn.click(); }
    });

    // Open and auto-focus the first input
    const firstInput = els.body.querySelector("input");
    return openModal(els, null, firstInput);
}
