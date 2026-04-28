// ===================================================================
// Terminal Banner — Guided startup message
//
// Redesigned for v2.3.2: more actionable, less noise.
// Adapts to three breakpoints: wide (≥60), medium (≥45), narrow.
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
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[90mv2.4.0\x1b[0m \x1b[90m│\x1b[0m Analysis Engine");
        term.writeln("  \x1b[90m" + "━".repeat(44) + "\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m Press \x1b[1m\x1b[37mEnter\x1b[0m\x1b[90m or type\x1b[0m \x1b[1m\x1b[37mstart\x1b[0m\x1b[90m to begin.\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m Type \x1b[1m\x1b[37mhelp\x1b[0m\x1b[90m for the full command list.\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33mDisclaimer:\x1b[0m \x1b[90mFast, preliminary triage data.");
        term.writeln("  \x1b[90mBrowser APIs only — verify per internal policies.\x1b[0m");
        term.writeln("  \x1b[90m(If on a blank page: navigate to a website and press Enter)\x1b[0m");
        term.writeln("  \x1b[90m(Or manually type a domain, e.g. google.com)\x1b[0m");
    } else if (cols >= 45) {
        // MEDIUM SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.4.0\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(34) + "\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mEnter\x1b[0m\x1b[90m or\x1b[0m \x1b[37mstart\x1b[0m\x1b[90m to begin\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mhelp\x1b[0m\x1b[90m for commands\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!]\x1b[0m \x1b[90mPreliminary triage only.\x1b[0m");
        term.writeln("  \x1b[90mIf on a blank tab: open a website & press Enter\x1b[0m");
        term.writeln("  \x1b[90mOr type a domain (e.g. google.com)\x1b[0m");
    } else {
        // NARROW SCREEN (Large fonts)
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.4.0\x1b[0m");
        term.writeln("  \x1b[90m━━━━━━━━━━━━━━━\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mstart\x1b[0m\x1b[90m to begin\x1b[0m");
        term.writeln("  \x1b[35m❯\x1b[0m \x1b[37mhelp\x1b[0m\x1b[90m for commands\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!]\x1b[0m \x1b[90mPreliminary triage only.\x1b[0m");
        term.writeln("  \x1b[90mOpen a website & press Enter\x1b[0m");
        term.writeln("  \x1b[90mOr type a domain (e.g. google.com)\x1b[0m");
    }

    term.writeln("");
}
