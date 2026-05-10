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

    try {
        const { cmdDetailedHelp } = await import("./detailed-help.js");
        const { suggestCommand } = await import("../../core/parser.js");
        const helpText = cmdDetailedHelp(cmdName.split(" ")[0].toLowerCase(), suggestCommand);
        if (helpText) term.write(`\n${helpText}\n`);
    } catch (err) {
        term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
    }

    term.write(`\n  ${ANSI.dim}Press ANY KEY or CLICK to return...${ANSI.reset}`);
    term.write("\x1b[?1003h\x1b[?1006h");
    watcher._mouseEnabled = true;

    watcher.onDataDisposable = term.onData((ev) => {
        // Ignore hovers/scrolls/releases
        if (ev.startsWith("\x1b[<")) {
            const mp = ev.match(/\x1b\[<(\d+);.*;.*M/);
            if (!mp || parseInt(mp[1]) !== 0) return;
        }
        disposeInput(watcher);
        term.write("\x1b[?1003l\x1b[?1006l");
        watcher._mouseEnabled = false;
        watcher.start(term, doneCallback);
    });
}
