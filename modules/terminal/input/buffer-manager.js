import { InputEvents } from "./events.js";
import { term, PROMPT } from "../terminal-ui.js";
import { isWriteLocked, enqueueWrite } from "../write-lock.js";
import { getTermCols, getHistory } from "../../state.js";

// ---------------------------------------------------------------------------
// Buffer State
// ---------------------------------------------------------------------------

let currentLine = "";
let cursorPosition = 0;
let isLocked = false;

export function getCurrentLine() {
    return currentLine;
}

export function getCursorPosition() {
    return cursorPosition;
}

export function isKeyboardLocked() {
    return isLocked;
}

export function setKeyboardLock(locked) {
    isLocked = locked;
}

// ---------------------------------------------------------------------------
// Buffer Math & Coordinates
// ---------------------------------------------------------------------------

export function getVisualRow(absPos, cols) {
    if (absPos === 0) return 0;
    return Math.floor((absPos - 1) / cols);
}

export function getVisualCol(absPos, cols) {
    if (absPos === 0) return 0;
    return absPos % cols === 0 ? cols : absPos % cols;
}

// ---------------------------------------------------------------------------
// Buffer Mutations & Rendering
// ---------------------------------------------------------------------------

export function updateBufferState(newLine, newCursor, oldCursor) {
    currentLine = newLine;
    cursorPosition = newCursor;
    refreshLine(oldCursor);
}

export function insertText(text) {
    const oldCursor = cursorPosition;
    currentLine =
        currentLine.slice(0, cursorPosition) +
        text +
        currentLine.slice(cursorPosition);
    cursorPosition += text.length;
    refreshLine(oldCursor);
}

export function setLine(text) {
    const oldCursor = cursorPosition;
    currentLine = text;
    cursorPosition = text.length;
    refreshLine(oldCursor);
}

export function clearBuffer() {
    currentLine = "";
    cursorPosition = 0;
}

export function clearCurrentLine(oldCursorPos = cursorPosition) {
    const cols = getTermCols();
    const promptLen = 2; // "❯ "
    const absCursor = promptLen + oldCursorPos;
    const cursorRow = getVisualRow(absCursor, cols);
    
    // Move up to the row where the prompt started
    let moveUp = cursorRow > 0 ? `\x1b[${cursorRow}A` : "";
    // \r moves to col 0. \x1b[J clears from cursor to end of screen.
    term.write(moveUp + "\r\x1b[J" + PROMPT);
}

export function refreshLine(oldCursorPos = cursorPosition) {
    const doRefresh = () => {
        const cols = getTermCols();
        const promptLen = 2; // "❯ "

        // 1. Calculate how many rows UP we need to go to reach the prompt's start
        const oldAbsCursor = promptLen + oldCursorPos;
        const cursorRow = getVisualRow(oldAbsCursor, cols);
        let moveUpToStart = cursorRow > 0 ? `\x1b[${cursorRow}A` : "";

        // 2. Clear from prompt start and rewrite the entire line
        let lineToWrite = currentLine;
        let isPlaceholder = false;
        if (currentLine === "" && getHistory().length === 0) {
            lineToWrite = "\x1b[90mgoogle.com\x1b[0m";
            isPlaceholder = true;
        }
        term.write(moveUpToStart + "\r\x1b[J" + PROMPT + lineToWrite);

        // 3. After writing, cursor is at the end of the text. 
        // We must move it to the NEW cursorPosition.
        const newTotalAbs = promptLen + (isPlaceholder ? 10 : currentLine.length);
        const newCursorAbs = promptLen + cursorPosition;
        
        // Rows the cursor should be on vs rows the end of line is on
        const newEndRow = getVisualRow(newTotalAbs, cols);
        const targetRow = getVisualRow(newCursorAbs, cols);
        const rowsUp = newEndRow - targetRow;
        
        let moveBackUp = rowsUp > 0 ? `\x1b[${rowsUp}A` : "";
        
        // Move to the exact column
        const targetCol = getVisualCol(newCursorAbs, cols);
        // \r goes to col 0. \x1b[<n>C moves right (only if n > 0).
        let moveCol = "\r";
        if (targetCol > 0) {
            moveCol += `\x1b[${targetCol}C`;
        }
        
        term.write(moveBackUp + moveCol);
        InputEvents.emit("EV_INPUT_UPDATED", currentLine);
    };

    if (isWriteLocked()) {
        enqueueWrite(doRefresh);
    } else {
        doRefresh();
    }
}
