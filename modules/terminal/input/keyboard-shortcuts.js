/**
 * @module modules/terminal/input/keyboard-shortcuts.js
 * @description Ctrl+[A/E/W/K] readline-style shortcuts for the terminal input line.
 *
 * @connections
 * - Imports: deleteWordBefore from './buffer-ops.js'
 *            getCursorPosition, getCurrentLine, updateBufferState from './buffer-manager.js'
 * - Exports: handleCtrlShortcut
 * - Layer: Terminal Layer (Input)
 */

import { deleteWordBefore } from "./buffer-ops.js";
import { getCursorPosition, getCurrentLine, updateBufferState } from "./buffer-manager.js";

/**
 * Handle readline Ctrl shortcuts.
 * @param {number} keyCode
 * @returns {boolean} true if the key was consumed, false otherwise
 */
export function handleCtrlShortcut(keyCode) {
    switch (keyCode) {
        case 65: { // Ctrl+A — beginning of line
            const cur = getCursorPosition();
            if (cur > 0) updateBufferState(getCurrentLine(), 0, cur);
            return true;
        }
        case 69: { // Ctrl+E — end of line
            const line = getCurrentLine();
            const cur = getCursorPosition();
            if (cur < line.length) updateBufferState(line, line.length, cur);
            return true;
        }
        case 87: { // Ctrl+W — delete word before cursor
            const line = getCurrentLine();
            const cur = getCursorPosition();
            if (cur <= 0) return true;
            const result = deleteWordBefore(line, cur);
            updateBufferState(result.line, result.cursor, cur);
            return true;
        }
        case 75: { // Ctrl+K — kill to end of line
            const line = getCurrentLine();
            const cur = getCursorPosition();
            if (cur >= line.length) return true;
            updateBufferState(line.slice(0, cur), cur, cur);
            return true;
        }
        default:
            return false;
    }
}
