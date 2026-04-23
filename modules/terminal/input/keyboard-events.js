import { InputEvents } from "./events.js";
import { term, PROMPT, writePrompt, isSystemWriting } from "../terminal-ui.js";
import { deleteCharBefore, deleteWordBefore, deleteCharAfter, deleteWordAfter, moveCursorWordLeft, moveCursorWordRight } from "./buffer-ops.js";

let currentLine = "";
let cursorPosition = 0;

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
        currentLine = "";
        cursorPosition = 0;
    });
}

export function getCurrentBuffer() {
    return currentLine;
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
        if (isLocked) return;

        // ── Editing shortcuts ──
        if (ctrlKey && keyCode === 76) {
            term.clear();
            term.write("\r\n");
            writePrompt();
            return;
        }
        if (ctrlKey && keyCode === 85) {
            clearCurrentLine();
            currentLine = "";
            cursorPosition = 0;
            return;
        }
        if (keyCode === 13) {
            term.write("\r\n");
            const input = currentLine.trim();
            currentLine = "";
            cursorPosition = 0;
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, input);
            return;
        }
        if (keyCode === 38) return InputEvents.emit(InputEvents.EV_HISTORY_NAVIGATE, "UP");
        if (keyCode === 40) return InputEvents.emit(InputEvents.EV_HISTORY_NAVIGATE, "DOWN");
        if (keyCode === 9)  { domEvent.preventDefault(); return InputEvents.emit(InputEvents.EV_TAB_PRESSED, currentLine); }

        // ── Buffer mutations (guard-clause style) ──
        if (keyCode === 8) {
            if (cursorPosition <= 0) return;
            const result = altKey
                ? deleteWordBefore(currentLine, cursorPosition)
                : deleteCharBefore(currentLine, cursorPosition);
            currentLine = result.line;
            cursorPosition = result.cursor;
            return refreshLine();
        }

        if (keyCode === 46) {
            if (cursorPosition >= currentLine.length) return;
            const result = altKey
                ? deleteWordAfter(currentLine, cursorPosition)
                : deleteCharAfter(currentLine, cursorPosition);
            currentLine = result.line;
            cursorPosition = result.cursor;
            return refreshLine();
        }

        // ── Cursor movement ──
        if (keyCode === 37) {
            if (cursorPosition <= 0) return;
            if (altKey) {
                cursorPosition = moveCursorWordLeft(currentLine, cursorPosition);
                refreshLine();
            } else {
                cursorPosition--;
                term.write("\x1b[D");
            }
            return;
        }
        if (keyCode === 39) {
            if (cursorPosition >= currentLine.length) return;
            if (altKey) {
                cursorPosition = moveCursorWordRight(currentLine, cursorPosition);
                refreshLine();
            } else {
                cursorPosition++;
                term.write("\x1b[C");
            }
            return;
        }
        if (keyCode === 36) {
            while (cursorPosition > 0) { cursorPosition--; term.write("\x1b[D"); }
            return;
        }
        if (keyCode === 35) {
            while (cursorPosition < currentLine.length) { cursorPosition++; term.write("\x1b[C"); }
            return;
        }

        // ── Printable character ──
        if (key.length === 1 && !ctrlKey) insertText(key);
    });
}

// ---------------------------------------------------------------------------
// Buffer Manipulation
// ---------------------------------------------------------------------------

let isLocked = false;
export function setKeyboardLock(locked) {
    isLocked = locked;
}

function insertText(text) {
    currentLine =
        currentLine.slice(0, cursorPosition) +
        text +
        currentLine.slice(cursorPosition);
    cursorPosition += text.length;
    refreshLine();
}

function clearCurrentLine() {
    term.write("\r" + PROMPT + "\x1b[K");
}

function refreshLine() {
    term.write("\r" + PROMPT + currentLine + "\x1b[K");
    const moveBack = currentLine.length - cursorPosition;
    if (moveBack > 0) {
        term.write(`\x1b[${moveBack}D`);
    }
    InputEvents.emit("EV_INPUT_UPDATED", currentLine);
}

export function setLine(text) {
    currentLine = text;
    cursorPosition = text.length;
    clearCurrentLine();
    term.write(text);
}
