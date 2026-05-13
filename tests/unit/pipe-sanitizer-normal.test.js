/**
 * @file tests/unit/pipe-sanitizer-normal.test.js
 * @description Normal output correctness tests for cleanForPipe().
 *              Covers standard WhatHappened output patterns and ANSI-wrapped cosmetic lines.
 *
 * Run: node --test tests/unit/pipe-sanitizer-normal.test.js
 * Run all pipe tests: node --test tests/unit/pipe-sanitizer-*.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanForPipe } from "../../modules/core/pipe-sanitizer.js";
import * as F from "../fixtures/adversarial-strings.js";

// ── 1. Normal Output — Correct Behaviour ─────────────────────────────────────

describe("cleanForPipe — normal WhatHappened output", () => {
    it("passes through raw DNS A record", () => {
        assert.equal(cleanForPipe("93.184.216.34"), "93.184.216.34");
    });

    it("passes through raw DNS AAAA record", () => {
        assert.equal(cleanForPipe("2606:2800:21f:cb07:6820:80da:af6b:8b2c"), "2606:2800:21f:cb07:6820:80da:af6b:8b2c");
    });

    it("passes through HTTP header lines", () => {
        assert.equal(cleanForPipe(F.RAW_HEADERS), F.RAW_HEADERS);
    });

    it("multi-record DNS output — all records survive", () => {
        assert.equal(cleanForPipe(F.RAW_DNS), F.RAW_DNS);
    });

    it("strips command echo line (> dig ...)", () => {
        assert.equal(cleanForPipe(F.ECHO_LINE), "");
    });

    it("strips INSIGHTS separator (unicode em-dash)", () => {
        assert.equal(cleanForPipe(F.INSIGHTS_SEP), "");
    });

    it("strips INSIGHTS separator (ASCII fallback --)", () => {
        assert.equal(cleanForPipe(F.INSIGHTS_SEP_ASCII), "");
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
        assert.equal(cleanForPipe(F.MIXED_REAL_OUTPUT), "93.184.216.34");
    });
});

// ── 2. ANSI-Wrapped Cosmetic Lines ───────────────────────────────────────────

describe("cleanForPipe — ANSI-wrapped cosmetic lines are still stripped", () => {
    it("strips command echo wrapped in ANSI color codes", () => {
        // Attacker: colors the echo line — SGR is stripped for the check, pattern still matched
        assert.equal(cleanForPipe("\x1b[32m> dig example.com\x1b[0m"), "");
    });

    it("strips [INFO] line wrapped in ANSI bold", () => {
        assert.equal(cleanForPipe("\x1b[1m[INFO] record found\x1b[0m"), "");
    });

    it("strips INSIGHTS separator wrapped in ANSI dim", () => {
        assert.equal(cleanForPipe("\x1b[2m── INSIGHTS ────────\x1b[0m"), "");
    });

    it("passes raw data line that contains ANSI — preserves codes in output", () => {
        // cleanForPipe strips ANSI only for the CONTENT CHECK, not from the output itself.
        // A colored IP line from a server is still raw data and survives with its colors.
        const input = "\x1b[32m93.184.216.34\x1b[0m";
        assert.equal(cleanForPipe(input), input);
    });
});
