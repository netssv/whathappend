import { ANSI } from "../formatter.js";
import { ROW_KEYS, ROW_LABELS } from "./progressive-renderer.js";

// ===================================================================
// Triage History — Static string builder for export
//
// Decoupled from ProgressiveRenderer. Receives resolved data
// and builds a plain-text representation for command history.
// ===================================================================

/**
 * Build a static output string for the command history / export.
 *
 * @param {Object} resolved — map of row key → resolved value (or null)
 * @param {string[]} providers — array of resolved provider names (non-null)
 * @returns {string} formatted delegation block for history logging
 */
export function buildTriageHistory(resolved, providers) {
    const lines = [];
    lines.push(`\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`);

    for (const key of ROW_KEYS) {
        const val = resolved[key] || "N/A";
        lines.push(`       ${ROW_LABELS[key]} ━ ${val}`);
    }

    if (providers && providers.length > 0) {
        const unique = [...new Set(providers.filter(Boolean))];
        if (unique.length > 0) {
            lines.push(`       ${ANSI.green}↳ [INFO] Managed by ${unique.join(', ')}${ANSI.reset}`);
        }
    }

    return lines.join("\n");
}
