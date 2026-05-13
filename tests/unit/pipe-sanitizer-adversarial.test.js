/**
 * @file tests/unit/pipe-sanitizer-adversarial.test.js
 * @description Security and false-positive tests for cleanForPipe().
 *              Covers hostile network data and data resembling stripped patterns.
 *
 * Run: node --test tests/unit/pipe-sanitizer-adversarial.test.js
 * Run all pipe tests: node --test tests/unit/pipe-sanitizer-*.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanForPipe } from "../../modules/core/pipe-sanitizer.js";
import * as F from "../fixtures/adversarial-strings.js";

// ── 3. Adversarial Network Data (Security Cases) ─────────────────────────────

describe("cleanForPipe — adversarial inputs from untrusted network sources", () => {
    it("passes through OSC injection (cleanForPipe is NOT the xterm guard)", () => {
        // cleanForPipe routes pipeline data only. ANSI/OSC stripping for xterm
        // display is the responsibility of sanitize-ansi.js (display layer).
        // This test DOCUMENTS the intentional scope boundary.
        const input = `93.184.216.34\n${F.ANSI_OSC_TITLE}`;
        const result = cleanForPipe(input);
        assert.ok(result.includes("93.184.216.34"), "IP address must survive");
    });

    it("handles null byte in input without throwing", () => {
        assert.doesNotThrow(() => cleanForPipe(F.NULL_BYTE));
        assert.equal(typeof cleanForPipe(F.NULL_BYTE), "string");
    });

    it("handles carriage-return-only lines without throwing", () => {
        // CR-only can appear in HTTP/1.1 responses from legacy servers
        assert.doesNotThrow(() => cleanForPipe(F.CR_ONLY));
    });

    it("handles input with only ANSI escape codes (no real data)", () => {
        // After SGR strip, lines become empty — all filtered out
        assert.equal(cleanForPipe("\x1b[31m\x1b[0m\x1b[1m"), "");
    });

    it("ANSI-prefixed [INFO] is still stripped (disguise attempt)", () => {
        // Attack: prepend invisible SGR to prevent [INFO] from matching the filter.
        // After stripSGR: "\x1b[0m[INFO] evil" → "[INFO] evil" → correctly stripped.
        assert.equal(cleanForPipe("\x1b[0m[INFO] attempt to survive"), "",
            "ANSI-prefixed [INFO] must still be stripped");
    });

    it("handles extremely long line without stack overflow", () => {
        const longLine = "x".repeat(100_000);
        assert.doesNotThrow(() => cleanForPipe(longLine));
        assert.equal(cleanForPipe(longLine), longLine);
    });

    it("handles 5000 lines within performance budget (<500ms)", () => {
        const lines = Array.from({ length: 5000 }, (_, i) => `record-${i}.example.com`);
        const input = lines.join("\n");
        const start = performance.now();
        const result = cleanForPipe(input);
        const elapsed = performance.now() - start;
        assert.ok(elapsed < 500,
            `cleanForPipe on 5000 lines took ${elapsed.toFixed(1)}ms — expected <500ms`);
        assert.equal(result.split("\n").length, 5000, "All raw lines must survive");
    });
});

// ── 4. False Positives — Data Resembling Stripped Patterns ───────────────────

describe("cleanForPipe — false positive prevention", () => {
    it("does NOT strip lines starting with '>>' (only '>' is command echo)", () => {
        assert.equal(cleanForPipe(F.DOUBLE_ARROW), F.DOUBLE_ARROW);
    });

    it("does NOT strip lines where [INFO] appears mid-line (not at position 0)", () => {
        assert.equal(cleanForPipe(F.INFO_MIDLINE), F.INFO_MIDLINE);
    });

    it("does NOT strip JSON-like content that contains ANSI-looking substrings", () => {
        assert.equal(cleanForPipe(F.JSON_LIKE_ANSI), F.JSON_LIKE_ANSI);
    });

    it("known limitation: lines starting with '--' are stripped (DNSKEY edge case)", () => {
        // This documents a known false positive: the '--' filter that catches the
        // ASCII INSIGHTS separator also strips lines like "-- DNSKEY record --".
        // Tracked as a known limitation in the architecture docs.
        assert.equal(cleanForPipe(F.LEGIT_DASHES), "",
            "Known limitation: '--' prefix stripped even for non-insight lines");
    });

    it("preserves IP addresses that look like version strings", () => {
        assert.equal(cleanForPipe("1.0.0.1\n8.8.8.8\n8.8.4.4"), "1.0.0.1\n8.8.8.8\n8.8.4.4");
    });

    it("preserves MX record output with numeric priority prefix", () => {
        assert.equal(
            cleanForPipe("10 mail.example.com.\n20 mail2.example.com."),
            "10 mail.example.com.\n20 mail2.example.com."
        );
    });
});
