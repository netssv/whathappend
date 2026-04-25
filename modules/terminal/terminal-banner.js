// ===================================================================
// Terminal Banner — Responsive startup message
//
// Extracted from terminal-ui.js for maintainability.
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
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[90m│\x1b[0m Web Infrastructure Triage \x1b[90m│\x1b[0m \x1b[33mv2.3.0\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(50) + "\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m for commands \x1b[90m│\x1b[0m \x1b[37m?\x1b[90m quick help \x1b[90m│\x1b[0m \x1b[37mCtrl+C\x1b[90m cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33mDisclaimer: \x1b[90mThis extension provides fast, preliminary triage data.");
        term.writeln("  \x1b[90mIt relies on browser APIs and cannot replace certified audits.");
        term.writeln("  \x1b[90mAlways verify findings according to your internal security policies.\x1b[0m");
    } else if (cols >= 45) {
        // MEDIUM SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.3.0\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(38) + "\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m \x1b[90m│\x1b[0m \x1b[37m?\x1b[90m quick \x1b[90m│\x1b[0m \x1b[37mCtrl+C\x1b[90m cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33mDisclaimer: \x1b[90mFast, preliminary triage data only.");
        term.writeln("  \x1b[90mRelies on browser APIs (no deep network scans).");
        term.writeln("  \x1b[90mVerify findings per internal security policies.\x1b[0m");
    } else {
        // NARROW SCREEN (Large fonts)
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.3.0\x1b[0m");
        term.writeln("  \x1b[90m━━━━━━━━━━━━━━━\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m or \x1b[37m?\x1b[90m");
        term.writeln("  \x1b[90mPress \x1b[37mCtrl+C\x1b[90m to cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!] \x1b[90mPreliminary triage only.");
        term.writeln("  \x1b[33m[!] \x1b[90mBrowser API limitations.");
        term.writeln("  \x1b[33m[!] \x1b[90mVerify via internal policies.\x1b[0m");
    }

    term.writeln("");
}
