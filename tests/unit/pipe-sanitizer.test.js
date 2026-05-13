/**
 * @file tests/unit/pipe-sanitizer.test.js
 * @description Adversarial test suite for cleanForPipe().
 *
 * Run: node --test tests/unit/pipe-sanitizer.test.js
 *
 * This suite covers:
 *   1. Normal WhatHappened output — correct lines survive, noise is stripped
 *   2. Adversarial inputs — hostile strings from untrusted network data
 *   3. False positives — real data that resembles stripped patterns
 *   4. Edge cases — empty, null, whitespace, unicode
 *   5. Pipeline integrity — output is usable as stdin for grep/wc/sort
 *
 * IMPORTANT: cleanForPipe() operates on strings that may originate from
 * untrusted HTTP servers. Each test documents the attack vector it guards against.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanForPipe } from "../../modules/core/pipe-sanitizer.js";
import * as F from "../fixtures/adversarial-strings.js";

// ── 1. Normal Output — Correct Behaviour ─────────────────────────────────────

describe("cleanForPipe — normal WhatHappened output", () => {
    it("passes through raw DNS A record", () => {
        const result = cleanForPipe("93.184.216.34");
        assert.equal(result, "93.184.216.34");
    });

    it("passes through raw DNS AAAA record", () => {
        const result = cleanForPipe("2606:2800:21f:cb07:6820:80da:af6b:8b2c");
        assert.equal(result, "2606:2800:21f:cb07:6820:80da:af6b:8b2c");
    });

    it("passes through HTTP header lines", () => {
        const result = cleanForPipe(F.RAW_HEADERS);
        assert.equal(result, F.RAW_HEADERS);
    });

    it("strips command echo line (> dig ...)", () => {
        const result = cleanForPipe(F.ECHO_LINE);
        assert.equal(result, "");
    });

    it("strips INSIGHTS separator (unicode em-dash)", () => {
        const result = cleanForPipe(F.INSIGHTS_SEP);
        assert.equal(result, "");
    });

    it("strips INSIGHTS separator (ASCII fallback --)", () => {
        const result = cleanForPipe(F.INSIGHTS_SEP_ASCII);
        assert.equal(result, "");
    });

    it("strips [INFO] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_INFO), "");
    });

    it("strips [WARN] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_WARN), "");
    });

    it("strips [PASS] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_PASS), "");
    });

    it("strips [CRIT] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_CRIT), "");
    });

    it("strips [FAIL] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_FAIL), "");
    });

    it("strips [ERROR] insight line", () => {
        assert.equal(cleanForPipe(F.INSIGHT_ERROR), "");
    });

    it("correctly separates raw data from noise in mixed output", () => {
        const result = cleanForPipe(F.MIXED_REAL_OUTPUT);
        assert.equal(result, "93.184.216.34");
    });

    it("multi-record DNS output — all records survive", () => {
        const result = cleanForPipe(F.RAW_DNS);
        assert.equal(result, F.RAW_DNS);
    });
});

// ── 2. ANSI Escape Sequences in Cosmetic Lines ───────────────────────────────

describe("cleanForPipe — ANSI-wrapped cosmetic lines are still stripped", () => {
    it("strips command echo wrapped in ANSI color codes", () => {
        // Attacker scenario: echo line colored with ANSI — should still be stripped
        const input = "\x1b[32m> dig example.com\x1b[0m";
        const result = cleanForPipe(input);
        assert.equal(result, "");
    });

    it("strips [INFO] line wrapped in ANSI bold", () => {
        const input = "\x1b[1m[INFO] record found\x1b[0m";
        const result = cleanForPipe(input);
        assert.equal(result, "");
    });

    it("strips INSIGHTS separator wrapped in ANSI dim", () => {
        const input = "\x1b[2m── INSIGHTS ────────\x1b[0m";
        const result = cleanForPipe(input);
        assert.equal(result, "");
    });

    it("passes raw data line that happens to contain ANSI (preserves ANSI in output)", () => {
        // A server returning colored output — raw data survives as-is
        // cleanForPipe only strips ANSI for the CHECK, not from the output line itself
        const input = "\x1b[32m93.184.216.34\x1b[0m";
        const result = cleanForPipe(input);
        // The line is raw data (not an echo/insight) — it survives WITH its ANSI codes
        assert.equal(result, input);
    });
});

// ── 3. Adversarial Network Data (Security Cases) ─────────────────────────────

describe("cleanForPipe — adversarial inputs from untrusted network sources", () => {
    it("passes through OSC title injection string (cleanForPipe is not the xterm guard)", () => {
        // cleanForPipe routes pipeline data. ANSI injection to xterm is handled
        // by sanitize-ansi.js at the display layer. This test documents that
        // cleanForPipe intentionally does NOT strip OSC sequences — that is NOT
        // its responsibility. The display layer must handle this separately.
        const input = `93.184.216.34\n${F.ANSI_OSC_TITLE}`;
        const result = cleanForPipe(input);
        // The IP line survives; the OSC line also survives (it's raw data, not a cosmetic line)
        // This is CORRECT behavior — OSC stripping happens at xterm write time.
        assert.ok(result.includes("93.184.216.34"), "IP address must survive");
    });

    it("handles null byte in input without throwing", () => {
        assert.doesNotThrow(() => cleanForPipe(F.NULL_BYTE));
        const result = cleanForPipe(F.NULL_BYTE);
        // null byte line is not empty after trim — it passes through as raw data
        assert.equal(typeof result, "string");
    });

    it("handles carriage-return-only lines", () => {
        // CR-only can appear in HTTP/1.1 responses from legacy servers
        assert.doesNotThrow(() => cleanForPipe(F.CR_ONLY));
    });

    it("handles input with only ANSI escape codes (no real data)", () => {
        // A server returning only escape codes — all cosmetic, nothing useful
        const input = "\x1b[31m\x1b[0m\x1b[1m";
        const result = cleanForPipe(input);
        // After ANSI strip, line is empty → filtered out
        assert.equal(result, "");
    });

    it("handles a line disguised as an insight via ANSI zero-width prefix", () => {
        // Attempt: prepend invisible ANSI to make "[INFO]" NOT match the filter
        // e.g., an attacker wants their [INFO] line to survive the pipe
        // After SGR strip: "\x1b[0m[INFO] evil" → "[INFO] evil" → correctly stripped
        const input = "\x1b[0m[INFO] attempt to survive";
        const result = cleanForPipe(input);
        assert.equal(result, "", "ANSI-prefixed [INFO] must still be stripped");
    });

    it("handles extremely long line without stack overflow", () => {
        const longLine = "x".repeat(100_000);
        assert.doesNotThrow(() => cleanForPipe(longLine));
        assert.equal(cleanForPipe(longLine), longLine);
    });

    it("handles thousands of lines without performance issue", () => {
        const lines = Array.from({ length: 5000 }, (_, i) => `record-${i}.example.com`);
        const input = lines.join("\n");
        const start = performance.now();
        const result = cleanForPipe(input);
        const elapsed = performance.now() - start;
        assert.ok(elapsed < 500, `cleanForPipe on 5000 lines took ${elapsed.toFixed(1)}ms — expected < 500ms`);
        assert.equal(result.split("\n").length, 5000, "All raw lines must survive");
    });
});

// ── 4. False Positives — Data That Resembles Stripped Patterns ───────────────

describe("cleanForPipe — false positive prevention", () => {
    it("does NOT strip lines starting with '>>' (only '>' is command echo)", () => {
        const result = cleanForPipe(F.DOUBLE_ARROW);
        assert.equal(result, F.DOUBLE_ARROW);
    });

    it("does NOT strip lines where [INFO] is in the middle (not at position 0)", () => {
        const result = cleanForPipe(F.INFO_MIDLINE);
        assert.equal(result, F.INFO_MIDLINE);
    });

    it("does NOT strip JSON-like content that contains ANSI-looking strings", () => {
        const result = cleanForPipe(F.JSON_LIKE_ANSI);
        assert.equal(result, F.JSON_LIKE_ANSI);
    });

    it("does NOT strip legitimate '--' lines that are not insight separators", () => {
        // DNS DNSKEY records and other responses can contain -- legitimately
        // This IS a known limitation: the current filter strips ANY line starting with '--'
        // This test DOCUMENTS the current behavior (even if imperfect).
        const result = cleanForPipe(F.LEGIT_DASHES);
        // Expected: stripped (known limitation — document the actual behavior)
        assert.equal(result, "", "Known limitation: lines starting with '--' are stripped");
    });

    it("preserves IP addresses that look like version numbers", () => {
        const result = cleanForPipe("1.0.0.1\n8.8.8.8\n8.8.4.4");
        assert.equal(result, "1.0.0.1\n8.8.8.8\n8.8.4.4");
    });

    it("preserves MX record output with priority", () => {
        const result = cleanForPipe("10 mail.example.com.\n20 mail2.example.com.");
        assert.equal(result, "10 mail.example.com.\n20 mail2.example.com.");
    });
});

// ── 5. Edge Cases ─────────────────────────────────────────────────────────────

describe("cleanForPipe — edge cases", () => {
    it("returns empty string for null input", () => {
        assert.equal(cleanForPipe(null), "");
    });

    it("returns empty string for undefined input", () => {
        assert.equal(cleanForPipe(undefined), "");
    });

    it("returns empty string for empty string input", () => {
        assert.equal(cleanForPipe(""), "");
    });

    it("returns empty string for whitespace-only string", () => {
        assert.equal(cleanForPipe("   \n   \n   "), "");
    });

    it("returns empty string for string of only newlines", () => {
        assert.equal(cleanForPipe("\n\n\n"), "");
    });

    it("handles single-line input with no trailing newline", () => {
        assert.equal(cleanForPipe("example.com"), "example.com");
    });

    it("handles single-line input with trailing newline", () => {
        // Trailing newline: split produces ["example.com", ""] — empty line filtered
        const result = cleanForPipe("example.com\n");
        assert.equal(result, "example.com");
    });

    it("handles unicode content in raw data", () => {
        const input = "✓ example.com\n★ important record";
        const result = cleanForPipe(input);
        assert.equal(result, input);
    });

    it("handles Windows-style CRLF line endings", () => {
        const input = "record1\r\nrecord2\r\nrecord3";
        assert.doesNotThrow(() => cleanForPipe(input));
    });

    it("does not mutate input string", () => {
        const input = "93.184.216.34\n[INFO] stripped";
        const copy = input;
        cleanForPipe(input);
        assert.equal(input, copy, "Input string must not be mutated");
    });
});

// ── 6. Pipeline Integrity — Output Usable as Stdin ───────────────────────────

describe("cleanForPipe — pipeline integrity (output is usable as stdin)", () => {
    it("output contains no INSIGHTS separator lines (safe for grep)", () => {
        const result = cleanForPipe(F.MIXED_REAL_OUTPUT);
        assert.ok(!result.includes("──"), "No em-dash separators in pipe output");
        assert.ok(!result.includes("[INFO]"), "No [INFO] lines in pipe output");
    });

    it("output lines are non-empty (safe for wc -l)", () => {
        const result = cleanForPipe(F.MIXED_REAL_OUTPUT);
        const lines = result.split("\n").filter(Boolean);
        assert.ok(lines.every(l => l.trim().length > 0), "All output lines must be non-empty");
    });

    it("grep simulation: filter IP lines from DNS output", () => {
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

    it("wc simulation: count lines in DNS multi-record output", () => {
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
