/**
 * @module modules/commands/util/help-runner.js
 * @description Orchestrates the display of detailed help documentation and
 *              handles the transition back to the interactive help TUI.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', disposeInput from './menu-runner.js'
 * - Layer: Command Layer (Util) — logic for executing help docs.
 */

import { ANSI } from "../../formatter.js";
import { disposeInput } from "./menu-runner.js";

/**
 * Shows the detailed help for a specific command and waits for user input
 * to return to the interactive help TUI.
 */
export async function showCommandDoc(cmdName, term, watcher, doneCallback) {
    disposeInput(watcher);
    if (watcher._mouseEnabled) {
        term.write("\x1b[?1003l\x1b[?1006l");
        watcher._mouseEnabled = false;
    }

    term.write("\x1b[2J\x1b[H");
    
    try {
        const { cmdDetailedHelp } = await import("./detailed-help.js");
        const { suggestCommand } = await import("../../core/parser.js");
        const helpText = await cmdDetailedHelp(cmdName.split(" ")[0].toLowerCase(), suggestCommand);
        if (helpText) term.write(`\n${helpText}\n`);
    } catch (err) {
        term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
    }

    term.write(`\n  ${ANSI.dim}Press ANY KEY to return...${ANSI.reset}`);
    // DO NOT enable mouse capture here so the user retains native scrolling!
    // Native scrollbar and trackpad will work perfectly.
    watcher._mouseEnabled = false;

    watcher.onDataDisposable = term.onData((ev) => {
        // If it's a mouse event (in case it leaked through), ignore it
        if (ev.startsWith("\x1b[<")) return;
        
        // Handle keyboard scrolling natively using xterm if they use arrows/pgup
        if (ev === "\x1b[A") { term.scrollLines(-1); return; }
        if (ev === "\x1b[B") { term.scrollLines(1); return; }
        if (ev === "\x1b[5~") { term.scrollPages(-1); return; }
        if (ev === "\x1b[6~") { term.scrollPages(1); return; }

        disposeInput(watcher);
        term.scrollToBottom();
        watcher.start(term, doneCallback);
    });
}
