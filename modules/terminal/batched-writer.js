/**
 * @module modules/terminal/batched-writer.js
 * @description Chunked, async output writer for xterm.js.
 *
 * Problem solved: When a command returns hundreds of lines at once (e.g. dkim,
 * dig TXT, deliverability), writing them in a synchronous loop blocks the main
 * thread, causing the xterm.js scrollback to "freeze", lines to visually cut
 * off, and the side-panel to become unresponsive.
 *
 * Solution: Split output into chunks and yield back to the browser between each
 * chunk via requestAnimationFrame. This lets the renderer "breathe", keeps the
 * scrollback intact, and prevents ghost lines / truncated results.
 *
 * @connections
 * - Imports: None (dependency-free)
 * - Exports: writeBatched, BATCH_SIZE, MAX_SAFE_LINES
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

/** Lines per animation frame tick. Tune this to balance speed vs smoothness. */
export const BATCH_SIZE = 60;

/**
 * Hard safety cap. If a command returns more lines than this, the excess is
 * truncated and the user is warned. Prevents OOM on runaway command output.
 * At ~100 chars/line this is ~5MB — well within Chrome side-panel limits.
 */
export const MAX_SAFE_LINES = 5000;

/**
 * Yield control back to the browser for one animation frame.
 * @returns {Promise<void>}
 */
function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Write `text` to `term` in asynchronous batches.
 *
 * @param {import('@xterm/xterm').Terminal} term  - Live xterm.js terminal instance.
 * @param {string}                          text  - Full output string (may contain ANSI).
 * @param {{ onDone?: () => void }}        [opts] - Optional callback invoked after last line.
 * @returns {Promise<void>}
 */
export async function writeBatched(term, text, opts = {}) {
    if (!term || !text) {
        opts.onDone?.();
        return;
    }

    // Split on newlines; remove a single trailing empty element produced by a
    // trailing "\n" so we don't generate a spurious blank line at the end.
    let lines = text.split("\n");
    if (lines.length > 1 && lines[lines.length - 1] === "") {
        lines = lines.slice(0, -1);
    }

    // Safety cap — warn the user if output is absurdly long
    if (lines.length > MAX_SAFE_LINES) {
        const truncated = lines.length - MAX_SAFE_LINES;
        lines = lines.slice(0, MAX_SAFE_LINES);
        lines.push(`\x1b[33m[!] Output truncated: ${truncated} additional lines omitted (limit: ${MAX_SAFE_LINES}).\x1b[0m`);
    }

    // Write in chunks, yielding between each batch
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const chunk = lines.slice(i, i + BATCH_SIZE);
        for (const line of chunk) {
            term.writeln(line);
        }
        // Yield after each batch — except the very last one
        if (i + BATCH_SIZE < lines.length) {
            term.scrollToBottom();
            await nextFrame();
        }
    }

    // Final scroll after all lines are written
    term.scrollToBottom();
    opts.onDone?.();
}
