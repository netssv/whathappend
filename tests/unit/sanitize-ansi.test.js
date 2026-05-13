/**
 * @file tests/unit/sanitize-ansi.test.js
 * @description Test suite for stripAnsi() — display-layer ANSI stripping.
 *
 * Run: node --test tests/unit/sanitize-ansi.test.js
 *
 * This tests the FULL VT/ANSI escape surface including vectors that
 * cleanForPipe() intentionally does NOT handle (OSC, CSI non-SGR).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripAnsi } from "../../modules/core/sanitize-ansi.js";
import * as F from "../fixtures/adversarial-strings.js";

// ── 1. SGR Color Codes ────────────────────────────────────────────────────────

describe("stripAnsi — SGR color codes", () => {
    it("strips SGR reset", () => {
        assert.equal(stripAnsi("\x1b[0mtext"), "text");
    });

    it("strips SGR red foreground", () => {
        assert.equal(stripAnsi("\x1b[31mred\x1b[0m"), "red");
    });

    it("strips SGR bold", () => {
        assert.equal(stripAnsi("\x1b[1mbold\x1b[0m"), "bold");
    });

    it("strips SGR compound chain (bold+color+bg)", () => {
        assert.equal(stripAnsi(F.ANSI_SGR_CHAIN + "text" + F.ANSI_SGR_RESET), "text");
    });

    it("strips multiple consecutive SGR codes", () => {
        assert.equal(stripAnsi("\x1b[1m\x1b[31mred bold\x1b[0m\x1b[0m"), "red bold");
    });

    it("preserves text between SGR codes", () => {
        assert.equal(stripAnsi("\x1b[31mhello\x1b[0m world \x1b[32mgoodbye\x1b[0m"), "hello world goodbye");
    });
});

// ── 2. CSI Non-SGR Sequences ──────────────────────────────────────────────────

describe("stripAnsi — CSI non-SGR sequences", () => {
    it("strips cursor up (ESC[A)", () => {
        assert.equal(stripAnsi(F.ANSI_CSI_CURSOR_UP + "text"), "text");
    });

    it("strips cursor movement (ESC[2;5H)", () => {
        assert.equal(stripAnsi("\x1b[2;5Htext"), "text");
    });

    it("strips erase display (ESC[2J)", () => {
        assert.equal(stripAnsi(F.ANSI_CSI_ERASE + "text"), "text");
    });

    it("strips save cursor position (ESC[s)", () => {
        assert.equal(stripAnsi("\x1b[stext"), "text");
    });

    it("strips restore cursor (ESC[u)", () => {
        assert.equal(stripAnsi("\x1b[utext"), "text");
    });

    it("strips show/hide cursor (ESC[?25h / ESC[?25l)", () => {
        assert.equal(stripAnsi("\x1b[?25htext\x1b[?25l"), "text");
    });
});

// ── 3. OSC Sequences (Critical Attack Surface) ────────────────────────────────

describe("stripAnsi — OSC sequences (security-critical)", () => {
    it("strips OSC title injection with BEL terminator", () => {
        // Attack: server injects ESC]0;malicious title BEL into HTTP header
        const result = stripAnsi(F.ANSI_OSC_TITLE + "real data");
        assert.equal(result, "real data", "OSC title injection must be stripped");
    });

    it("strips OSC title injection with ESC-backslash terminator", () => {
        const result = stripAnsi(F.ANSI_OSC_TITLE_ALT + "real data");
        assert.equal(result, "real data", "OSC alt terminator must be stripped");
    });

    it("strips OSC clipboard write attempt", () => {
        // ESC]52;c;<base64> — clipboard access in some terminals
        const result = stripAnsi(F.ANSI_OSC_CLIPBOARD + "real data");
        assert.equal(result, "real data", "OSC clipboard sequence must be stripped");
    });

    it("strips OSC with numeric parameter", () => {
        assert.equal(stripAnsi("\x1b]2;title\x07real"), "real");
    });

    it("preserves content after OSC sequence", () => {
        const result = stripAnsi("\x1b]0;evil\x0793.184.216.34");
        assert.equal(result, "93.184.216.34");
    });
});

// ── 4. Adversarial Compound Inputs ───────────────────────────────────────────

describe("stripAnsi — adversarial compound sequences", () => {
    it("handles nested SGR + OSC in a single string", () => {
        const input = "\x1b[31m\x1b]0;title\x07malicious\x1b[0m clean data";
        const result = stripAnsi(input);
        assert.equal(result, "malicious clean data");
    });

    it("handles partial sequence at end of string (no terminator)", () => {
        // Partial sequence — may not be stripped but must not throw
        assert.doesNotThrow(() => stripAnsi(F.ANSI_PARTIAL));
        const result = stripAnsi(F.ANSI_PARTIAL);
        assert.equal(typeof result, "string");
    });

    it("handles string of ONLY escape sequences", () => {
        const result = stripAnsi("\x1b[31m\x1b[0m\x1b]0;title\x07");
        assert.equal(result, "");
    });

    it("handles null byte in string — does not throw", () => {
        assert.doesNotThrow(() => stripAnsi(F.NULL_BYTE));
    });

    it("handles extremely long string with embedded sequences", () => {
        const input = ("x".repeat(1000) + "\x1b[31m").repeat(100);
        assert.doesNotThrow(() => stripAnsi(input));
        const result = stripAnsi(input);
        assert.ok(!result.includes("\x1b"), "No escape sequences in output");
    });
});

// ── 5. Non-String Inputs ──────────────────────────────────────────────────────

describe("stripAnsi — non-string inputs (defensive)", () => {
    it("returns empty string for null", () => {
        assert.equal(stripAnsi(null), "");
    });

    it("returns empty string for undefined", () => {
        assert.equal(stripAnsi(undefined), "");
    });

    it("returns empty string for number", () => {
        assert.equal(stripAnsi(42), "");
    });

    it("returns empty string for object", () => {
        assert.equal(stripAnsi({}), "");
    });

    it("returns empty string for array", () => {
        assert.equal(stripAnsi([]), "");
    });
});

// ── 6. Legitimate Content Preservation ───────────────────────────────────────

describe("stripAnsi — legitimate content is preserved", () => {
    it("preserves plain IP address", () => {
        assert.equal(stripAnsi("93.184.216.34"), "93.184.216.34");
    });

    it("preserves HTTP header value", () => {
        const hdr = "content-type: text/html; charset=UTF-8";
        assert.equal(stripAnsi(hdr), hdr);
    });

    it("preserves JSON string", () => {
        const json = '{"key": "value", "num": 42}';
        assert.equal(stripAnsi(json), json);
    });

    it("preserves empty string", () => {
        assert.equal(stripAnsi(""), "");
    });

    it("preserves unicode characters", () => {
        assert.equal(stripAnsi("✓ record valid — résumé"), "✓ record valid — résumé");
    });

    it("preserves bracket notation that is NOT an escape sequence", () => {
        // [INFO] at start of line — this is a content string, not ANSI
        assert.equal(stripAnsi("[INFO] server log"), "[INFO] server log");
    });

    it("does not mutate input string", () => {
        const input = "\x1b[31mtest\x1b[0m";
        const copy = input;
        stripAnsi(input);
        assert.equal(input, copy);
    });
});
