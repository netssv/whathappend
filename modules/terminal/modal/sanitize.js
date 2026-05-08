/**
 * @module modules/terminal/modal/sanitize.js
 * @description Safe HTML sanitizer for modal dialogs and UI components.
 *
 * Allows a curated set of safe HTML tags and attributes while stripping
 * everything else. This prevents DOM XSS from user-derived data (e.g.,
 * domain names, tab titles) flowing into innerHTML assignments.
 *
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: sanitizeHTML, clearElement
 * - Layer: Terminal Layer (UI) - Security utility.
 */

// Allowed tags and their permitted attributes
const ALLOWED_TAGS = new Set([
    "b", "i", "em", "strong", "br", "span", "code", "small", "div", "p"
]);

const ALLOWED_ATTRS = new Map([
    ["span",  new Set(["style", "class"])],
    ["div",   new Set(["style", "class"])],
    ["code",  new Set(["class"])],
    ["strong", new Set(["style", "class"])],
]);

/**
 * Sanitize an HTML string by removing dangerous tags and attributes.
 * Only allows a curated whitelist of safe formatting tags.
 *
 * @param {string} html - Raw HTML string (potentially unsafe)
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(html) {
    if (!html) return "";
    if (typeof html !== "string") return String(html);

    // Create a temporary container to parse the HTML
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    // Walk the tree and strip disallowed elements
    sanitizeNode(tmp);

    return tmp.innerHTML;
}

/**
 * Recursively sanitize a DOM node tree in place.
 * @param {Node} node
 */
function sanitizeNode(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
            continue; // Text nodes are always safe
        }

        if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = child.tagName.toLowerCase();

            if (!ALLOWED_TAGS.has(tag)) {
                // Replace disallowed element with its text content
                const text = document.createTextNode(child.textContent);
                node.replaceChild(text, child);
                continue;
            }

            // Strip disallowed attributes
            const allowedAttrs = ALLOWED_ATTRS.get(tag) || new Set();
            const attrs = Array.from(child.attributes);
            for (const attr of attrs) {
                if (!allowedAttrs.has(attr.name)) {
                    child.removeAttribute(attr.name);
                }
                // Extra safety: strip javascript: from style values
                if (attr.name === "style" && /expression|javascript|url\s*\(/i.test(attr.value)) {
                    child.removeAttribute("style");
                }
            }

            // Recurse into children
            sanitizeNode(child);
        } else {
            // Remove comment nodes and other non-element/text nodes
            node.removeChild(child);
        }
    }
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
