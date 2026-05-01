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

// ---------------------------------------------------------------------------
// Terminal Configuration — Uses default theme from themes.js
// ---------------------------------------------------------------------------

const TERMINAL_THEME = THEMES[DEFAULT_THEME_ID].xterm;

export const PROMPT_PREFIX = "\x1b[36m~\x1b[0m\r\n";
export const PROMPT = "\x1b[35m❯\x1b[0m ";

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

    // Initialize theme engine (restores saved theme from storage)
    initThemeEngine(term);

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (term && fitAddon) {
                fitAddon.fit();
                setTermCols(term.cols);
            }
        }, 50);
    });

    // Watch for header geometry changes (triad/tab-switch bar show/hide)
    const observer = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (term && fitAddon) {
                fitAddon.fit();
                setTermCols(term.cols);
            }
        }, 50);
    });
    observer.observe(container);

    setupFontControls();

    return new Promise((resolve) => {
        setTimeout(() => {
            fitAddon.fit();
            setTermCols(term.cols);
            resolve();
        }, 50);
    });
}

/** Re-fit the terminal to the current available space. */
export function refitTerminal() {
    if (fitAddon) {
        fitAddon.fit();
        setTermCols(term.cols);
        term.scrollToBottom();
    }
}

// ---------------------------------------------------------------------------
// Font Size Controls — [−] [+]
// ---------------------------------------------------------------------------

const FONT_MIN = 10;
const FONT_MAX = 20;

function updateFontSize(delta) {
    if (!term) return;
    const current = term.options.fontSize || 12;
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, current + delta));
    if (next === current) return;
    
    term.options.fontSize = next;
    fitAddon.fit();
    setTermCols(term.cols);
    
    // Force full re-render to avoid layout ghosting
    term.refresh(0, term.rows - 1);
    term.focus();
    
    try { chrome.storage.local.set({ termFontSize: next }); } catch (_) {}
}

function setupFontControls() {
    // Restore saved font size
    try {
        chrome.storage.local.get("termFontSize", (result) => {
            if (result.termFontSize && result.termFontSize >= FONT_MIN && result.termFontSize <= FONT_MAX) {
                term.options.fontSize = result.termFontSize;
                fitAddon.fit();
                setTermCols(term.cols);
            }
        });
    } catch (_) {}

    document.getElementById("font-decrease")?.addEventListener("click", () => updateFontSize(-1));
    document.getElementById("font-increase")?.addEventListener("click", () => updateFontSize(1));
}

// ---------------------------------------------------------------------------
// UI Output Helpers
// ---------------------------------------------------------------------------

/** Delegate to terminal-banner.js, passing the current term instance. */
export function showBanner() {
    _showBanner(term);
}

export function writePrompt() {
    // Write the prompt, and the dim placeholder only if it's the very first command
    if (getHistory().length === 0) {
        term.write(PROMPT_PREFIX + PROMPT + "\x1b[90mgoogle.com\x1b[0m\x1b[10D");
    } else {
        term.write(PROMPT_PREFIX + PROMPT);
    }
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
