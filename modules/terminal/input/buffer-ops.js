/**
 * @module modules/terminal/input/buffer-ops.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: deleteCharBefore, deleteWordBefore, deleteCharAfter, deleteWordAfter, moveCursorWordLeft, moveCursorWordRight
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

/**
 * Pure buffer manipulation functions.
 * No side effects, no terminal writes — just string math.
 */

export function deleteCharBefore(line, cursor) {
    if (cursor <= 0) return { line, cursor };
    return {
        line: line.slice(0, cursor - 1) + line.slice(cursor),
        cursor: cursor - 1,
    };
}

export function deleteWordBefore(line, cursor) {
    let newCursor = cursor - 1;
    while (newCursor >= 0 && line[newCursor] === ' ') newCursor--;
    while (newCursor >= 0 && line[newCursor] !== ' ') newCursor--;
    newCursor++;
    return {
        line: line.slice(0, newCursor) + line.slice(cursor),
        cursor: newCursor,
    };
}

export function deleteCharAfter(line, cursor) {
    if (cursor >= line.length) return { line, cursor };
    return {
        line: line.slice(0, cursor) + line.slice(cursor + 1),
        cursor,
    };
}

export function deleteWordAfter(line, cursor) {
    let end = cursor;
    while (end < line.length && line[end] === ' ') end++;
    while (end < line.length && line[end] !== ' ') end++;
    return {
        line: line.slice(0, cursor) + line.slice(end),
        cursor,
    };
}

export function moveCursorWordLeft(line, cursor) {
    let c = cursor - 1;
    while (c >= 0 && line[c] === ' ') c--;
    while (c >= 0 && line[c] !== ' ') c--;
    return Math.max(0, c + 1);
}

export function moveCursorWordRight(line, cursor) {
    let c = cursor;
    while (c < line.length && line[c] === ' ') c++;
    while (c < line.length && line[c] !== ' ') c++;
    return c;
}
