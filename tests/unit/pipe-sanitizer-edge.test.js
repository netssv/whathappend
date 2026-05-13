/**
 * @file tests/unit/pipe-sanitizer-edge.test.js
 * @description Edge case and pipeline integrity tests for cleanForPipe().
 *              Covers null/empty inputs, unicode, CRLF, and pipe stdin usability.
 *
 * Run: node --test tests/unit/pipe-sanitizer-edge.test.js
 * Run all pipe tests: node --test tests/unit/pipe-sanitizer-*.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanForPipe } from "../../modules/core/pipe-sanitizer.js";
import * as F from "../fixtures/adversarial-strings.js";

// ── 5. Edge Cases ─────────────────────────────────────────────────────────────

describe("cleanForPipe — edge cases", () => {
    it("returns empty string for null input", () => {
        assert.equal(cleanForPipe(null), "");
    });

    it("returns empty string for undefined input", () => {
        assert.equal(cleanForPipe(undefined), "");
    });

    it("returns empty string for empty string", () => {
        assert.equal(cleanForPipe(""), "");
    });

    it("returns empty string for whitespace-only string", () => {
        assert.equal(cleanForPipe("   \n   \n   "), "");
    });

    it("returns empty string for newlines-only string", () => {
        assert.equal(cleanForPipe("\n\n\n"), "");
    });

    it("handles single-line input with no trailing newline", () => {
        assert.equal(cleanForPipe("example.com"), "example.com");
    });

    it("strips trailing newline — empty final line is filtered", () => {
        // split("example.com\n") → ["example.com", ""] — empty line removed
        assert.equal(cleanForPipe("example.com\n"), "example.com");
    });

    it("handles unicode content in raw data", () => {
        const input = "✓ example.com\n★ important record";
        assert.equal(cleanForPipe(input), input);
    });

    it("handles Windows-style CRLF line endings without throwing", () => {
        assert.doesNotThrow(() => cleanForPipe("record1\r\nrecord2\r\nrecord3"));
    });

    it("does not mutate the input string", () => {
        const input = "93.184.216.34\n[INFO] stripped";
        const copy = input;
        cleanForPipe(input);
        assert.equal(input, copy, "Input string must not be mutated");
    });
});

// ── 6. Pipeline Integrity — Output Usable as Stdin ───────────────────────────

describe("cleanForPipe — pipeline integrity (output is usable as stdin)", () => {
    it("output contains no INSIGHTS separators (safe for grep)", () => {
        const result = cleanForPipe(F.MIXED_REAL_OUTPUT);
        assert.ok(!result.includes("──"), "No em-dash separators in pipe output");
        assert.ok(!result.includes("[INFO]"), "No [INFO] lines in pipe output");
    });

    it("all output lines are non-empty (safe for wc -l)", () => {
        const result = cleanForPipe(F.MIXED_REAL_OUTPUT);
        const lines = result.split("\n").filter(Boolean);
        assert.ok(lines.every(l => l.trim().length > 0), "All output lines must be non-empty");
    });

    it("grep simulation: extract IP from DNS output via pipe", () => {
        const dnsOutput = [
            "> dig example.com A",
            "93.184.216.34",
            "── INSIGHTS ──",
            "[INFO] IPv4 only",
        ].join("\n");

        const piped = cleanForPipe(dnsOutput);
        // Simulate: dig example.com | grep "93."
        const grepResult = piped.split("\n").filter(l => l.includes("93."));
        assert.deepEqual(grepResult, ["93.184.216.34"]);
    });

    it("wc simulation: count MX records via pipe", () => {
        const dnsOutput = [
            "> dig example.com MX",
            "10 mail1.example.com.",
            "20 mail2.example.com.",
            "30 mail3.example.com.",
            "[INFO] 3 MX records found.",
        ].join("\n");

        const piped = cleanForPipe(dnsOutput);
        const lineCount = piped.split("\n").filter(Boolean).length;
        assert.equal(lineCount, 3, "wc should see exactly 3 MX records");
    });
});
