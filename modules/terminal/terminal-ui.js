/**
 * @module modules/terminal/terminal-ui.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - setTermCols, getTermCols from '../state.js'
 *     - showBanner as _showBanner from './terminal-banner.js'
 *     - THEMES, DEFAULT_THEME_ID from '../data/themes.js'
 *     - initThemeEngine from './theme-engine.js'
 *     - writeBatched from './batched-writer.js'
 * - Exports: PROMPT_PREFIX, PROMPT, term, fitAddon, isSystemWriting, initTerminalUI, refitTerminal, showBanner, writePrompt, writeOutput, showSpinner, stopSpinner
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

import { setTermCols, getTermCols } from "../state.js";
import { showBanner as _showBanner } from "./terminal-banner.js";
import { THEMES, DEFAULT_THEME_ID } from "../data/themes.js";
import { initThemeEngine } from "./theme-engine.js";
import { applyExactMargin, setupFontControls } from "./terminal-resize.js";
import { writeBatched } from "./batched-writer.js";

// Prompt rendering delegated to terminal-prompt.js (keeps this file under 200 lines)
export { writePrompt, PROMPT, PROMPT_PREFIX } from "./terminal-prompt.js";

// ---------------------------------------------------------------------------
// Terminal Configuration — Uses default theme from themes.js
// ---------------------------------------------------------------------------

const TERMINAL_THEME = THEMES[DEFAULT_THEME_ID].xterm;


import { TerminalMultiplexer } from "./terminal-multiplexer.js";

export const term = new Proxy({}, {
    get(target, prop) {
        if (!TerminalMultiplexer.activeSession || !TerminalMultiplexer.activeSession.term) return undefined;
        const val = TerminalMultiplexer.activeSession.term[prop];
        return typeof val === "function" ? val.bind(TerminalMultiplexer.activeSession.term) : val;
    },
    set(target, prop, value) {
        if (!TerminalMultiplexer.activeSession || !TerminalMultiplexer.activeSession.term) return false;
        TerminalMultiplexer.activeSession.term[prop] = value;
        return true;
    }
});

export const fitAddon = new Proxy({}, {
    get(target, prop) {
        if (!TerminalMultiplexer.activeSession || !TerminalMultiplexer.activeSession.fitAddon) return undefined;
        const val = TerminalMultiplexer.activeSession.fitAddon[prop];
        return typeof val === "function" ? val.bind(TerminalMultiplexer.activeSession.fitAddon) : val;
    }
});

let _isSystemWriting = false;

/** Check if the system is currently writing automated output to the terminal. */
export function isSystemWriting() {
    return _isSystemWriting;
}

export async function createTerminalInstance(container) {
    const localTerm = new window.Terminal({
        theme: TERMINAL_THEME,
        fontFamily: '"Source Code Pro", "Fira Code", "Cascadia Code", "Consolas", monospace',
        fontSize: 12,
        lineHeight: 1.3,
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 10000,
        allowTransparency: true,
        convertEol: true,
        wordSeparator: ` ()[]{}'\\"`,
    });

    const localFitAddon = new window.FitAddon.FitAddon();
    const webLinksAddon = new window.WebLinksAddon.WebLinksAddon();

    localTerm.loadAddon(localFitAddon);
    localTerm.loadAddon(webLinksAddon);

    localTerm.open(container);

    // Let Ctrl+V pass through to the browser so the native 'paste' event
    // fires. clipboard-handler.js Layer 1/2 will process it.
    // Returning false tells xterm to NOT intercept the event.
    localTerm.attachCustomKeyEventHandler((e) => {
        if (e.ctrlKey && e.key === 'v') return false;
        return true;
    });

    // Initialize theme engine (restores saved theme from storage)
    initThemeEngine(localTerm);

    let resizeTimeout;
    const doResize = () => {
        if (localTerm && localFitAddon) {
            localFitAddon.fit();
            setTermCols(localTerm.cols);
            applyExactMargin(localTerm, container.id);
            localTerm.refresh(0, Math.max(0, localTerm.rows - 1));
            localTerm.scrollToBottom();
        }
    };

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(doResize, 150);
    });

    // Watch for header geometry changes (triad/tab-switch bar show/hide)
    const observer = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(doResize, 150);
    });
    observer.observe(container);

    setupFontControls(localTerm, localFitAddon);

    return new Promise((resolve) => {
        setTimeout(() => {
            localFitAddon.fit();
            setTermCols(localTerm.cols);
            applyExactMargin(localTerm, container.id);
            resolve({ term: localTerm, fitAddon: localFitAddon });
        }, 50);
    });
}

/** Re-fit the active terminal to the current available space. */
export function refitTerminal() {
    if (fitAddon && fitAddon.fit) {
        fitAddon.fit();
        setTermCols(term.cols);
        applyExactMargin(term);
        term.scrollToBottom();
    }
}

// Resize logic extracted to terminal-resize.js

// ---------------------------------------------------------------------------
// UI Output Helpers
// ---------------------------------------------------------------------------

/** Delegate to terminal-banner.js, passing the current term instance. */
export function showBanner() {
    _showBanner(term);
}


/**
 * Write command output to the terminal using batched async rendering.
 *
 * @param {string} output - Full output string (may contain ANSI codes).
 * @param {"terminal"|"menu"} [source="terminal"] - Origin of the command.
 *   When "menu", each line is capped at (term.cols - 4) visible chars so that
 *   RSA blobs, TXT records, and other wide data never overflow the side-panel.
 *
 * Returns a Promise so callers can await completion before writing the prompt.
 */
export async function writeOutput(output, source = "terminal") {
    _isSystemWriting = true;
    try {
        const activeTerm = TerminalMultiplexer.activeSession?.term;
        if (!activeTerm) return;
        const maxLineLen = source === "menu"
            ? Math.max(40, (activeTerm.cols || getTermCols()) - 4)
            : 0;  // 0 = no truncation for terminal-typed commands
        await writeBatched(activeTerm, output, { maxLineLen });
    } finally {
        _isSystemWriting = false;
    }
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function showSpinner() {
    const frames = ["|", "/", "-", "\\"];
    let i = 0;
    term.write(`\x1b[90m${frames[0]}\x1b[0m`);
    return setInterval(() => {
        i = (i + 1) % frames.length;
        term.write(`\x1b[1D\x1b[90m${frames[i]}\x1b[0m`);
    }, 120);
}

export function stopSpinner(interval) {
    clearInterval(interval);
    term.write("\x1b[1D \x1b[1D");
}
