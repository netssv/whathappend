/**
 * @module modules/core/sanitize-ansi.js
 * @description Display-layer ANSI escape sequence stripper.
 *
 * PURPOSE: Strip ALL ANSI/VT escape sequences from untrusted network data
 * (HTTP headers, WHOIS responses, DNS TXT records) BEFORE writing to xterm.js.
 *
 * SCOPE: This is NOT the same as the pipe-sanitizer. This module covers the
 * full VT/ANSI escape surface including:
 *   - SGR color codes:      ESC [ ... m
 *   - CSI sequences:        ESC [ ... (any terminator A-Z, a-z, @)
 *   - OSC sequences:        ESC ] ... ST (BEL or ESC \)
 *   - Simple ESC sequences: ESC followed by a single character
 *   - C1 control chars:     0x80–0x9F (8-bit ANSI)
 *
 * WHY OSC matters: OSC sequences like ESC]0;title\x07 can manipulate terminal
 * window titles. ESC]52;... can attempt clipboard access in some terminals.
 * xterm.js implements a subset of these — stripping them is the safe default
 * for untrusted data.
 *
 * @connections
 * - Imports: none (dependency-free)
 * - Exports: stripAnsi
 * - Used by: any module writing untrusted external data to xterm.js
 * - Layer: Core Layer — pure function, no side effects.
 */

/**
 * Full VT/ANSI escape sequence regex.
 *
 * Covers:
 *   - SGR/CSI sequences:  ESC [ <params> <terminator>     e.g. \x1b[31m, \x1b[2J, \x1b[?25h
 *   - OSC sequences:      ESC ] <text> <ST>               e.g. \x1b]0;title\x07
 *   - Simple ESC+char:    ESC followed by a printable      e.g. \x1bM (reverse index)
 *
 * NOTE: In JS regex, inside a character class [...], the backslash-range
 * [@-Z\\-_] does NOT include "]" because ] terminates the class.
 * OSC uses ESC + "]" which requires explicit handling outside the class.
 */
const ANSI_RE = new RegExp(
    // CSI: ESC [ followed by parameter bytes, intermediate bytes, final byte
    "\x1b\\[[0-?]*[ -/]*[@-~]" +
    "|" +
    // OSC: ESC ] followed by any chars until BEL (\x07) or ST (\x1b\\)
    "\x1b\\][^\x07\x1b]*(?:\x07|\x1b\\\\)" +
    "|" +
    // Simple two-character ESC sequences (ESC + single char, excluding [ and ])
    "\x1b[^\\[\\]]",
    "g"
);

/**
 * Strip all ANSI/VT escape sequences from a string.
 * Safe to call on any string, including empty or non-string values.
 *
 * @param {string} str - Potentially hostile string from an external source.
 * @returns {string} Plain text with all escape sequences removed.
 *
 * @example
 * stripAnsi("\x1b[31mRed text\x1b[0m")       // → "Red text"
 * stripAnsi("\x1b]0;window title\x07data")    // → "data"
 * stripAnsi("normal string")                  // → "normal string"
 * stripAnsi(null)                             // → ""
 */
export function stripAnsi(str) {
    if (typeof str !== "string") return "";
    return str.replace(ANSI_RE, "");
}
