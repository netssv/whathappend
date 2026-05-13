/**
 * @module modules/terminal/modal/sanitize.js
 * @description Safe HTML sanitizer for modal dialogs and UI components.
 *
 * Wraps DOMPurify to provide enterprise-grade protection against mXSS and
 * DOM-based injection attacks, ensuring user-derived data can be safely
 * rendered into innerHTML.
 *
 * @connections
 * - Imports: Requires DOMPurify to be loaded globally via script tag.
 * - Exports: sanitizeHTML, clearElement
 * - Layer: Terminal Layer (UI) - Security utility.
 */

// Allowed tags and their permitted attributes to keep the terminal UI clean
const ALLOWED_TAGS = [
    "b", "i", "em", "strong", "br", "span", "code", "small", "div", "p"
];

const ALLOWED_ATTR = ["style", "class"];

/**
 * Sanitize an HTML string by removing dangerous tags and attributes.
 * Delegates to the industry-standard DOMPurify library.
 *
 * @param {string} html - Raw HTML string (potentially unsafe)
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(html) {
    if (!html) return "";
    if (typeof html !== "string") return String(html);

    // Verify DOMPurify is available in the global scope
    if (typeof window.DOMPurify !== "undefined") {
        return window.DOMPurify.sanitize(html, {
            ALLOWED_TAGS,
            ALLOWED_ATTR,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            RETURN_DOM_IMPORT: false
        });
    }

    // Fallback security: If DOMPurify fails to load, strip all HTML.
    // We create a temporary element and extract only text content.
    console.error("DOMPurify not loaded. Falling back to strict text-only mode.");
    const tmp = document.createElement("div");
    tmp.textContent = html; // textContent automatically escapes HTML
    return tmp.innerHTML;
}

/**
 * Safely clear all children from an element without using innerHTML.
 * Modern alternative to `el.innerHTML = ""`.
 *
 * @param {HTMLElement} el
 */
export function clearElement(el) {
    if (el) el.replaceChildren();
}
