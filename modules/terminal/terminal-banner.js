/**
 * @module modules/terminal/terminal-banner.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: showBanner
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

// ===================================================================
// Terminal Banner — Guided startup message
// ===================================================================

/**
 * Print the startup banner to the terminal.
 * @param {Terminal} term — xterm.js terminal instance
 */
export function showBanner(term) {
    term.writeln("");
    const cols = term.cols || 80;

    if (cols >= 60) {
        // WIDE SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.8.4\x1b[0m \x1b[90m│\x1b[0m Platform Navigator");
        term.writeln("  \x1b[90m" + "━".repeat(44) + "\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[1m\x1b[37mmenu\x1b[0m\x1b[90m  — Interactive command navigator\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[1m\x1b[37mstart\x1b[0m\x1b[90m — Analyze current tab\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[1m\x1b[37mhelp\x1b[0m\x1b[90m  — Full command list\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!]\x1b[0m \x1b[90mPreliminary triage only. Verify data per internal policies.\x1b[0m");
        term.writeln("  \x1b[90mTip: Bind shortcuts for start, flush, watch at chrome://extensions/shortcuts\x1b[0m");
    } else if (cols >= 45) {
        // MEDIUM SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.8.4\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(34) + "\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mmenu\x1b[0m\x1b[90m  - Command navigator\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mstart\x1b[0m\x1b[90m - Analyze active tab\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mhelp\x1b[0m\x1b[90m  - View all commands\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!]\x1b[0m \x1b[90mPreliminary triage only.\x1b[0m");
        term.writeln("  \x1b[90mTip: Map shortcuts at chrome://extensions/shortcuts\x1b[0m");
    } else {
        // NARROW SCREEN (Large fonts)
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.8.4\x1b[0m");
        term.writeln("  \x1b[90m━━━━━━━━━━━━━━━\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mmenu\x1b[0m\x1b[90m  (navigator)\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mstart\x1b[0m\x1b[90m (analyze tab)\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mhelp\x1b[0m\x1b[90m  (all tools)\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!]\x1b[0m \x1b[90mPreliminary triage.\x1b[0m");
        term.writeln("  \x1b[90mSet shortcuts: chrome://extensions/shortcuts\x1b[0m");
    }

    term.writeln("");
}
