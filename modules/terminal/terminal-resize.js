/**
 * @module modules/terminal/terminal-resize.js
 * @description Manages font sizing, responsive refitting, and exact mathematical margins
 * to prevent layout ghosting and maintain consistent bottom-padding.
 *
 * @connections
 * - Imports: setTermCols from '../state.js'
 * - Exports: updateFontSize, applyExactMargin, setupFontControls
 * - Layer: Terminal Layer (UI Utilities)
 */

import { setTermCols } from "../state.js";

const FONT_MIN = 10;
const FONT_MAX = 20;

export function applyExactMargin(term, containerId = "terminal-container") {
    if (!term || !term._core) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    const xtermDiv = container.querySelector('.xterm');
    if (!xtermDiv) return;
    
    try {
        const style = window.getComputedStyle(container);
        const innerHeight = container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const cellHeight = term._core._renderService.dimensions.actualCellHeight || 1;
        const remainder = innerHeight % cellHeight;
        
        // Push the .xterm container down by exactly the remainder space
        // This ensures the bottom of .xterm is completely flush with the container's bottom padding.
        if (remainder >= 0 && remainder < cellHeight) {
            xtermDiv.style.marginTop = `${remainder}px`;
        }
    } catch (e) {}
}

export function updateFontSize(term, fitAddon, delta) {
    if (!term) return;
    const current = term.options.fontSize || 12;
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, current + delta));
    if (next === current) return;
    
    term.options.fontSize = next;
    
    // Defer the fit calculation slightly to allow the DOM to reflow with the new font size
    setTimeout(() => {
        if (!term || !fitAddon) return;
        fitAddon.fit();
        setTermCols(term.cols);
        
        applyExactMargin(term);
        
        // Force full re-render to avoid layout ghosting
        term.refresh(0, Math.max(0, term.rows - 1));
        term.scrollToBottom();
        term.focus();
    }, 50);
    
    try { chrome.storage.local.set({ termFontSize: next }); } catch (_) {}
}

export function setupFontControls(term, fitAddon) {
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

    document.getElementById("font-decrease")?.addEventListener("click", () => updateFontSize(term, fitAddon, -1));
    document.getElementById("font-increase")?.addEventListener("click", () => updateFontSize(term, fitAddon, 1));
}
