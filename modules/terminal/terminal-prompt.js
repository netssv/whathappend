/**
 * @module modules/terminal/terminal-prompt.js
 * @description Renders the shell prompt with the active domain and optional execution time.
 *              Extracted from terminal-ui.js to maintain the 200-line module limit.
 *
 * @connections
 * - Imports: ContextManager from '../context.js'
 *            getHistory from '../state.js'
 * - Exports: writePrompt, PROMPT, PROMPT_PREFIX
 * - Layer: Terminal Layer (UI)
 */

import { ContextManager } from "../context.js";
import { getHistory } from "../state.js";
import { term } from "./terminal-ui.js";

// Shell prompt constants (re-exported for backwards-compat with importers)
export const PROMPT_PREFIX = "\x1b[36m~\x1b[0m\r\n";
export const PROMPT        = "\x1b[35m❯\x1b[0m ";

/**
 * Write the shell prompt to the terminal.
 *
 * @param {number|null} execMs  Elapsed ms of the last command.
 *                              Displayed in gray only when > 500ms.
 */
export function writePrompt(execMs = null) {
    const domain = ContextManager?.getDomain?.() || null;
    const domainPart = domain && domain !== "restricted"
        ? `\x1b[90m${domain}\x1b[0m`
        : `\x1b[90m~\x1b[0m`;
    const timePart = execMs != null && execMs > 500
        ? ` \x1b[90m[${(execMs / 1000).toFixed(1)}s]\x1b[0m`
        : "";
    
    // Add an empty line before the prompt for visual breathing room
    // unless it's the very first prompt in the terminal
    const isFirst = getHistory().length === 0;
    const prefix = (isFirst ? "" : "\r\n") + domainPart + timePart + "\r\n";

    if (getHistory().length === 0) {
        // Show faint placeholder hint on the very first prompt
        term.write(prefix + PROMPT + "\x1b[90mgoogle.com\x1b[0m\x1b[10D");
    } else {
        term.write(prefix + PROMPT);
    }
}
