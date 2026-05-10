/**
 * @module modules/core/sudo-guard.js
 * @description Sudo privilege guard — blocks high-impact commands unless
 *              the user has activated privileged mode via `sudo`.
 *
 * Mirrors real Linux behavior: running a privileged command without `sudo`
 * returns a permission-denied error with a hint.
 *
 * @connections
 * - Imports: ContextManager from '../context.js', ANSI from '../formatter.js'
 * - Exports: checkSudoGuard, SUDO_COMMANDS
 * - Layer: Core — Pre-execution gate in the command pipeline.
 */

import { ContextManager } from "../context.js";
import { ANSI } from "../formatter.js";

/**
 * Commands that require `sudo` to execute.
 * Grouped by risk category for clarity.
 */
export const SUDO_COMMANDS = new Set([
    // ── Data Destruction ──
    "flush",          // Wipes cookies, cache, saved logins for a domain
    "cookies",        // Read/inspect cookies (privacy-sensitive)

    // ── Content Manipulation ──
    "edit",           // Injects live CSS/JS into the page DOM
    "block",          // Blocks scripts, images, or resources on the page

    // ── Network Interception ──
    "throttle",       // Alters network speed (can break pages)

    // ── Emulation / Spoofing ──
    "useragent",      // Spoofs browser identity (UA string)
    "mobile",         // Emulates mobile viewport and UA
    "geo",            // Spoofs geolocation coordinates
    "ip-spoof",       // Injects fake IP headers

    // ── Scanning (aggressive) ──
    "port-scan",      // Active port probe against remote host
    "malware",        // Queries threat intelligence APIs
]);

/**
 * Check if a resolved command requires sudo and whether the user has it.
 * @param {string} resolved - The resolved command name (after alias expansion).
 * @returns {string|null} Error message string if blocked, null if allowed.
 */
export function checkSudoGuard(resolved) {
    if (!SUDO_COMMANDS.has(resolved)) return null;
    if (ContextManager.isPrivileged()) return null;

    // Linux-authentic permission denied message
    return [
        `${ANSI.red}${ANSI.bold}bash: ${resolved}: Permission denied${ANSI.reset}`,
        `${ANSI.dim}This command requires elevated privileges.${ANSI.reset}`,
        `${ANSI.dim}Run ${ANSI.reset}${ANSI.yellow}sudo${ANSI.reset}${ANSI.dim} first to enable privileged mode.${ANSI.reset}`,
    ].join("\n");
}
