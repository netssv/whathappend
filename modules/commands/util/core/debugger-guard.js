/**
 * @module modules/commands/util/core/debugger-guard.js
 * @description On-demand debugger permission guard for optional_permissions.
 *
 * Since `debugger` is declared as an optional_permission in manifest.json,
 * commands that require CDP access (throttle, block) must request it at
 * runtime. This module provides a single entry point to check + request
 * the permission, and a fallback URL generator for when the user declines.
 *
 * @connections
 * - Imports: ANSI from '../../../formatter.js'
 * - Exports: ensureDebugger, getDebuggerFallbackMessage
 * - Layer: Command Layer (Util/Core) - Permission guard utility.
 */

import { ANSI } from "../../../formatter.js";

/**
 * Check if the debugger permission is already granted.
 * @returns {Promise<boolean>}
 */
async function hasDebuggerPermission() {
    try {
        const result = await chrome.permissions.contains({ permissions: ["debugger"] });
        return result;
    } catch {
        return false;
    }
}

/**
 * Ensure the debugger permission is available.
 * If not granted, prompts the user via chrome.permissions.request().
 * Returns true if permission is available, false if denied.
 *
 * @returns {Promise<boolean>}
 */
export async function ensureDebugger() {
    // Fast path: already granted
    if (await hasDebuggerPermission()) return true;

    // Request permission (MV3 requires a user gesture — the command itself is the gesture)
    try {
        const granted = await chrome.permissions.request({ permissions: ["debugger"] });
        return granted;
    } catch {
        return false;
    }
}

/**
 * Generate a user-friendly error message when debugger is unavailable,
 * with an external fallback URL for the diagnostic the user wanted.
 *
 * @param {string} tool - The tool name ("throttle" or "block")
 * @param {string} [domain] - Optional target domain for the fallback URL
 * @returns {string} Formatted terminal output
 */
export function getDebuggerFallbackMessage(tool, domain) {
    let o = `\n${ANSI.yellow}[PERMISSION REQUIRED]${ANSI.reset} The ${ANSI.bold}${tool}${ANSI.reset} command needs the ${ANSI.cyan}debugger${ANSI.reset} permission.\n`;
    o += `${ANSI.dim}This permission was not granted. It can be enabled on demand:${ANSI.reset}\n\n`;
    o += `  ${ANSI.white}1.${ANSI.reset} Run the command again — Chrome will prompt you to allow it.\n`;
    o += `  ${ANSI.white}2.${ANSI.reset} Or grant it manually at ${ANSI.cyan}chrome://extensions${ANSI.reset} → WhatHappened → Permissions.\n`;

    // Offer external fallback
    if (domain) {
        const fallbackUrl = tool === "throttle"
            ? `https://www.webpagetest.org/easy.php?url=${encodeURIComponent(`https://${domain}`)}`
            : `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`https://${domain}`)}`;

        o += `\n${ANSI.dim}External fallback:${ANSI.reset}\n`;
        o += `  ${ANSI.cyan}${fallbackUrl}${ANSI.reset}\n`;
    }

    return o;
}
