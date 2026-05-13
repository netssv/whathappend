/**
 * @module modules/core/pipe-sanitizer.js
 * @description Pipeline stdin sanitizer — strips cosmetic/display-only output lines.
 *
 * Extracted from engine.js to be independently testable and importable.
 *
 * @connections
 * - Imports: none (dependency-free)
 * - Exports: cleanForPipe
 * - Used by: engine.js, tests/unit/pipe-sanitizer.test.js
 * - Layer: Core Layer — pure function, no side effects.
 */

/**
 * Strips ANSI SGR color/style codes from a string for content-based comparisons.
 * NOTE: This is intentionally narrow — it only strips the subset used in our
 * output formatting (SGR codes: ESC [ ... m). For display-layer ANSI stripping
 * (untrusted network data), use modules/core/sanitize-ansi.js instead.
 * @param {string} str
 * @returns {string}
 */
function stripSGR(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Remove terminal-display lines that should not flow through a pipe.
 *
 * In real Linux, `dig +short` stdout only contains raw answers.
 * Our commands include echoes and INSIGHTS for readability — these must
 * be stripped when the output is used as stdin for the next command.
 *
 * Stripped patterns:
 *   - Empty/whitespace-only lines
 *   - Command echo:      "> dig ..." / "> curl ..."
 *   - INSIGHTS separator: "── INSIGHTS ──" / "-- INSIGHTS --"
 *   - Insight entries:   "[INFO] ..." / "[WARN] ..." / "[PASS] ..." / "[CRIT] ..."
 *
 * NOT stripped (passes through):
 *   - Raw DNS records:   "93.184.216.34"
 *   - Raw header lines:  "content-type: text/html"
 *   - Lines starting with ">>" (not a command echo)
 *   - Lines where "[INFO" is not at position 0
 *
 * @param {string | null | undefined} output - Raw command output string.
 * @returns {string} Sanitized string safe for use as next command's stdin.
 */
export function cleanForPipe(output) {
    if (!output) return "";
    return output
        .split("\n")
        .filter(line => {
            // Strip ANSI SGR codes for content checks only
            const clean = stripSGR(line).trim();
            if (!clean) return false;
            if (/^>[^>]|^>$/.test(clean)) return false;    // command echo (> cmd) but NOT >> output
            if (clean.startsWith("──") || clean.startsWith("--")) return false; // INSIGHTS separator
            if (/^\[(INFO|WARN|PASS|CRIT|FAIL|ERROR)\]/.test(clean)) return false; // insight entries
            return true;
        })
        .join("\n");
}
