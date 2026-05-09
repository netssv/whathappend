/**
 * @module modules/terminal/terminal-ui.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - setTermCols, getHistory from '../state.js'
 *     - showBanner as _showBanner from './terminal-banner.js'
 *     - THEMES, DEFAULT_THEME_ID from '../data/themes.js'
 *     - initThemeEngine from './theme-engine.js'
 * - Exports: PROMPT_PREFIX, PROMPT, term, fitAddon, isSystemWriting, initTerminalUI, refitTerminal, showBanner, writePrompt, writeOutput, showSpinner, stopSpinner
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

import { setTermCols, getHistory } from "../state.js";
import { showBanner as _showBanner } from "./terminal-banner.js";
import { THEMES, DEFAULT_THEME_ID } from "../data/themes.js";
import { initThemeEngine } from "./theme-engine.js";
import { applyExactMargin, setupFontControls } from "./terminal-resize.js";

// Prompt rendering delegated to terminal-prompt.js (keeps this file under 200 lines)
export { writePrompt, PROMPT, PROMPT_PREFIX } from "./terminal-prompt.js";

// ---------------------------------------------------------------------------
// Terminal Configuration — Uses default theme from themes.js
// ---------------------------------------------------------------------------

const TERMINAL_THEME = THEMES[DEFAULT_THEME_ID].xterm;


export let term;
export let fitAddon;
let _isSystemWriting = false;

/** Check if the system is currently writing automated output to the terminal. */
export function isSystemWriting() {
    return _isSystemWriting;
}

export function initTerminalUI(containerId) {
    term = new window.Terminal({
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

    fitAddon = new window.FitAddon.FitAddon();
    const webLinksAddon = new window.WebLinksAddon.WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    const container = document.getElementById(containerId);
    term.open(container);

    // Let Ctrl+V pass through to the browser so the native 'paste' event
    // fires. clipboard-handler.js Layer 1/2 will process it.
    // Returning false tells xterm to NOT intercept the event.
    term.attachCustomKeyEventHandler((e) => {
        if (e.ctrlKey && e.key === 'v') return false;
        return true;
    });

    // Initialize theme engine (restores saved theme from storage)
    initThemeEngine(term);

    let resizeTimeout;
    const doResize = () => {
        if (term && fitAddon) {
            fitAddon.fit();
            setTermCols(term.cols);
            applyExactMargin(term, containerId);
            term.refresh(0, Math.max(0, term.rows - 1));
            term.scrollToBottom();
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

    setupFontControls(term, fitAddon);

    return new Promise((resolve) => {
        setTimeout(() => {
            fitAddon.fit();
            setTermCols(term.cols);
            applyExactMargin(term, containerId);
            resolve();
        }, 50);
    });
}

/** Re-fit the terminal to the current available space. */
export function refitTerminal() {
    if (fitAddon) {
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


export function writeOutput(output) {
    _isSystemWriting = true;
    try {
        const lines = output.split("\n");
        for (const line of lines) {
            term.writeln(line);
        }
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
