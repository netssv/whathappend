/**
 * @module modules/commands/util/menu-input.js
 * @description Pure input routing for the Platform Navigator TUI.
 *              Handles mouse events, keyboard navigation, carousel, search activation.
 *
 * @connections
 * - Exports: parseSgrMouse, handleMenuInput
 * - Layer: Command Layer (Util) — input handler, no side effects on term.
 */

// ── SGR Mouse Parser ──────────────────────────────────────────────────

/**
 * Parse a raw SGR mouse escape sequence into a structured event.
 * @returns {{ btn, x, absY, isPress } | null}
 */
export function parseSgrMouse(e, term) {
    if (!e.startsWith("\x1b[<")) return null;
    const m = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
    if (!m) return null;
    return {
        btn: parseInt(m[1]),
        x: parseInt(m[2]),
        absY: (term.buffer?.active?.baseY ?? 0) + parseInt(m[3]),
        isPress: m[4] === "M",
    };
}

// ── Key Identity Helpers ──────────────────────────────────────────────

export const isQuit    = (e, lower) => lower === "q" || lower === "quit" || e === "\x03";
export const isLeft    = (e, lower) => e === "\x1b[D" || lower === "," || lower === "<" || lower === "prev";
export const isRight   = (e, lower) => e === "\x1b[C" || lower === "." || lower === ">" || lower === "next";
export const isUp      = (e) => e === "\x1b[A";
export const isDown    = (e) => e === "\x1b[B";
export const isEnter   = (e) => e === "\r" || e === "\n";
export const isSearch  = (e) => e === "/" || e === "?";
export const isEsc     = (e) => e === "\x1b";
export const isBack    = (e) => e === "\x7f" || e === "\b";
export const isPrintable = (e) => e.length === 1 && e >= " " && e !== "\x7f";

/** Map single char to zero-based index (1→0, a→9, etc.) */
export function charToIndex(c) {
    if (/^\d+$/.test(c)) return parseInt(c) - 1;
    if (c.length === 1 && c >= "a" && c <= "z") return c.charCodeAt(0) - 97 + 9;
    return -1;
}

/** Convert a zero-based index to its key label (0→"1", 9→"a") */
export function idxToKey(i) {
    return i < 9 ? (i + 1).toString() : String.fromCharCode(97 + i - 9);
}

// ── Carousel Navigation ───────────────────────────────────────────────

/** Cyclic prev index. Pass total category/section count. */
export function carouselPrev(currentIdx, count) {
    const c = currentIdx - 1;
    return c < 0 ? count - 1 : c;
}

/** Cyclic next index. Pass total category/section count. */
export function carouselNext(currentIdx, count) {
    const c = currentIdx + 1;
    return c >= count ? 0 : c;
}

// ── List Navigation ───────────────────────────────────────────────────

/** Move selection up with wrap-around. Pass in total item count. */
export function listUp(hoveredIdx, itemCount) {
    if (hoveredIdx <= 0) return itemCount - 1; // wrap to bottom
    return hoveredIdx - 1;
}

/** Move selection down with wrap-around. Pass in total item count. */
export function listDown(hoveredIdx, itemCount) {
    if (hoveredIdx >= itemCount - 1) return 0; // wrap to top
    return hoveredIdx + 1;
}
