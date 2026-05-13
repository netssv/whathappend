/**
 * @file tests/fixtures/adversarial-strings.js
 * @description Shared corpus of hostile and edge-case strings for security tests.
 *
 * These represent realistic payloads that an attacker controlling a web server
 * could inject into HTTP response headers, WHOIS responses, or DNS TXT records.
 */

// ── ANSI / VT Escape Sequences ────────────────────────────────────────────────

/** Standard SGR color reset */
export const ANSI_SGR_RESET = "\x1b[0m";

/** SGR color code — what our formatter uses */
export const ANSI_SGR_RED = "\x1b[31m";

/** SGR bold + color chain */
export const ANSI_SGR_CHAIN = "\x1b[1;32;40m";

/** CSI cursor movement — NOT an SGR code, different terminator */
export const ANSI_CSI_CURSOR_UP = "\x1b[A";

/** CSI erase display */
export const ANSI_CSI_ERASE = "\x1b[2J";

/** OSC window title injection — classic attack vector */
export const ANSI_OSC_TITLE = "\x1b]0;injected title\x07";

/** OSC title with ESC \\ terminator (alternative BEL) */
export const ANSI_OSC_TITLE_ALT = "\x1b]2;injected title\x1b\\";

/** OSC clipboard write attempt (xterm-specific) */
export const ANSI_OSC_CLIPBOARD = "\x1b]52;c;aGVsbG8=\x07";

/** Partial ANSI sequence at string boundary */
export const ANSI_PARTIAL = "data\x1b[3";

/** Nested / compound sequence */
export const ANSI_COMPOUND = "\x1b[1m\x1b[31mred bold\x1b[0m\x1b[0m";

// ── Control Characters ─────────────────────────────────────────────────────────

/** Null byte */
export const NULL_BYTE = "before\x00after";

/** Carriage return without newline */
export const CR_ONLY = "line1\rline2";

/** Backspace character */
export const BACKSPACE = "hel\x08lo";

/** Form feed */
export const FORM_FEED = "page1\x0cpage2";

// ── WhatHappened Output Patterns ──────────────────────────────────────────────

/** Typical raw DNS output — MUST survive cleanForPipe */
export const RAW_DNS = "93.184.216.34\n2606:2800:21f:cb07:6820:80da:af6b:8b2c";

/** Typical HTTP header output — MUST survive cleanForPipe */
export const RAW_HEADERS = "content-type: text/html; charset=UTF-8\ncache-control: no-store";

/** Command echo line — MUST be stripped by cleanForPipe */
export const ECHO_LINE = "> dig example.com A +short";

/** INSIGHTS separator — MUST be stripped by cleanForPipe */
export const INSIGHTS_SEP = "── INSIGHTS ──────────────────";

/** INSIGHTS separator (ASCII fallback) — MUST be stripped */
export const INSIGHTS_SEP_ASCII = "-- INSIGHTS --";

/** Insight entry — MUST be stripped by cleanForPipe */
export const INSIGHT_INFO = "[INFO] IPv4 only — no AAAA record found.";
export const INSIGHT_WARN = "[WARN] No DMARC record found.";
export const INSIGHT_PASS = "[PASS] HSTS header present.";
export const INSIGHT_CRIT = "[CRIT] SSL certificate expires in 3 days.";
export const INSIGHT_FAIL = "[FAIL] SPF record missing.";
export const INSIGHT_ERROR = "[ERROR] Connection timed out.";

/** Mixed real output — tests that cleanForPipe correctly separates signal from noise */
export const MIXED_REAL_OUTPUT = [
    "> dig example.com A +short",
    "",
    "93.184.216.34",
    "",
    "── INSIGHTS ──────────────────────────────────",
    "[INFO] IPv4 address found.",
    "[WARN] No IPv6 (AAAA) record.",
].join("\n");

// ── False Positives (must NOT be stripped) ────────────────────────────────────

/** Line starting with ">>" — not a command echo */
export const DOUBLE_ARROW = ">> some server output";

/** Line containing "[INFO]" but not at position 0 — should survive */
export const INFO_MIDLINE = "server: [INFO] request received";

/** Data that looks like ANSI in a JSON value */
export const JSON_LIKE_ANSI = '{"value": "[0m", "code": 31}';

/** Legitimate dash-dash lines (not an INSIGHTS separator) */
export const LEGIT_DASHES = "-- some legit dnskey record data --";
