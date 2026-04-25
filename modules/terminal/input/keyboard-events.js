import { InputEvents } from "./events.js";
import { term, writePrompt, isSystemWriting } from "../terminal-ui.js";
import { deleteCharBefore, deleteWordBefore, deleteCharAfter, deleteWordAfter, moveCursorWordLeft, moveCursorWordRight } from "./buffer-ops.js";
import { getTermCols } from "../../state.js";

import {
    getCurrentLine,
    getCursorPosition,
    isKeyboardLocked,
    setKeyboardLock,
    insertText,
    setLine,
    clearBuffer,
    clearCurrentLine,
    refreshLine,
    updateBufferState,
    getVisualRow
} from "./buffer-manager.js";

// Re-export for compatibility with index.js if needed
export function getCurrentBuffer() {
    return getCurrentLine();
}
export { setKeyboardLock, setLine };

export function initKeyboardEvents() {
    setupTerminalListener();

    // Listen to changes emitted from other modules (like History or Autocomplete)
    InputEvents.on(InputEvents.EV_BUFFER_CHANGE, (newLine) => {
        setLine(newLine);
    });

    // Listen to sanitized paste events
    InputEvents.on(InputEvents.EV_PASTE_TEXT, (text) => {
        insertText(text);
    });
    
    // Listen to clear screen
    InputEvents.on(InputEvents.EV_CLEAR_SCREEN, () => {
        clearBuffer();
    });
}

function setupTerminalListener() {
    term.onKey(({ key, domEvent }) => {
        // ── Command Firewall: drop events while system is writing ──
        if (isSystemWriting()) return;

        const { keyCode, ctrlKey, altKey } = domEvent;

        // ── Global shortcuts (work even when locked) ──
        if (ctrlKey && keyCode === 67) {
            if (term.hasSelection()) {
                navigator.clipboard.writeText(term.getSelection()).catch(() => { });
                term.clearSelection();
            } else {
                InputEvents.emit(InputEvents.EV_INTERRUPT, null);
            }
            return;
        }
        if (ctrlKey && keyCode === 86) {
            InputEvents.emit("EV_TRIGGER_MANUAL_PASTE", null);
            return;
        }
        if (keyCode !== 9) InputEvents.emit(InputEvents.EV_KEY_TYPED, keyCode);
        if (isKeyboardLocked()) return;

        // ── Editing shortcuts ──
        if (ctrlKey && keyCode === 76) {
            term.clear();
            term.write("\r\n");
            writePrompt();
            return;
        }
        if (ctrlKey && keyCode === 85) {
            clearCurrentLine();
            clearBuffer();
            return;
        }
        if (keyCode === 13) {
            const currentLine = getCurrentLine();
            if (currentLine === "") {
                // Clear the placeholder before submitting empty string
                clearCurrentLine();
                term.write("\r\n");
                InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, "");
                return;
            }

            // Move cursor to the end of the visual line before printing newline
            const cols = getTermCols();
            const promptLen = 2; // "❯ "
            const cursorPosition = getCursorPosition();
            const newTotalAbs = promptLen + currentLine.length;
            const newCursorAbs = promptLen + cursorPosition;
            const newEndRow = getVisualRow(newTotalAbs, cols);
            const targetRow = getVisualRow(newCursorAbs, cols);
            const rowsDown = newEndRow - targetRow;
            if (rowsDown > 0) {
                term.write(`\x1b[${rowsDown}B`); // move down
            }
            term.write("\r\n");
            
            const input = currentLine.trim();
            clearBuffer();
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, input);
            return;
        }
        
        const currentLine = getCurrentLine();
        if (keyCode === 38) return InputEvents.emit(InputEvents.EV_HISTORY_NAVIGATE, "UP");
        if (keyCode === 40) return InputEvents.emit(InputEvents.EV_HISTORY_NAVIGATE, "DOWN");
        if (keyCode === 9)  { domEvent.preventDefault(); return InputEvents.emit(InputEvents.EV_TAB_PRESSED, currentLine); }

        const cursorPosition = getCursorPosition();

        // ── Buffer mutations (guard-clause style) ──
        if (keyCode === 8) {
            if (cursorPosition <= 0) return;
            const result = altKey
                ? deleteWordBefore(currentLine, cursorPosition)
                : deleteCharBefore(currentLine, cursorPosition);
            return updateBufferState(result.line, result.cursor, cursorPosition);
        }

        if (keyCode === 46) {
            if (cursorPosition >= currentLine.length) return;
            const result = altKey
                ? deleteWordAfter(currentLine, cursorPosition)
                : deleteCharAfter(currentLine, cursorPosition);
            return updateBufferState(result.line, result.cursor, cursorPosition);
        }

        // ── Cursor movement ──
        if (keyCode === 37) {
            if (cursorPosition <= 0) return;
            let newPos = altKey 
                ? moveCursorWordLeft(currentLine, cursorPosition) 
                : cursorPosition - 1;
            return updateBufferState(currentLine, newPos, cursorPosition);
        }
        if (keyCode === 39) {
            if (cursorPosition >= currentLine.length) return;
            let newPos = altKey 
                ? moveCursorWordRight(currentLine, cursorPosition) 
                : cursorPosition + 1;
            return updateBufferState(currentLine, newPos, cursorPosition);
        }
        if (keyCode === 36) { // Home
            return updateBufferState(currentLine, 0, cursorPosition);
        }
        if (keyCode === 35) { // End
            return updateBufferState(currentLine, currentLine.length, cursorPosition);
        }

        // ── Printable character ──
        if (key.length === 1 && !ctrlKey) insertText(key);
    });
}
