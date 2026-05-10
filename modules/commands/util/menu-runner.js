/**
 * @module modules/commands/util/menu-runner.js
 * @description Command execution and post-run "press any key" flow for the Platform Navigator.
 *              Separates the async run pipeline from input routing and UI rendering.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: runCommand, waitForReturn, disposeInput, disableMouse, enableHoverMouse
 * - Layer: Command Layer (Util) — execution bridge.
 */

import { ANSI } from "../../formatter.js";

// ── Mouse Control ─────────────────────────────────────────────────────

export function enableHoverMouse(term) {
    term.write("\x1b[?1003h\x1b[?1006h");
}

export function enableClickMouse(term) {
    term.write("\x1b[?1000h\x1b[?1006h");
}

export function disableMouse(term) {
    term.write("\x1b[?1003l\x1b[?1006l");
}

export function disableClickMouse(term) {
    term.write("\x1b[?1000l\x1b[?1006l");
}

// ── Input Cleanup ─────────────────────────────────────────────────────

export function disposeInput(watcher) {
    if (watcher.onDataDisposable) {
        watcher.onDataDisposable.dispose();
        watcher.onDataDisposable = null;
    }
}

// ── Quit Flow ─────────────────────────────────────────────────────────

export function quit(term, watcher, doneCallback) {
    disposeInput(watcher);
    term.clear();
    import("../../terminal-ui.js").then(ui => ui.showBanner());
    doneCallback();
}

// ── Command Execution ─────────────────────────────────────────────────

/**
 * Execute a platform command and handle the result.
 * After completion, calls waitForReturn so the user can go back to the menu.
 */
export async function runCommand(cmdToRun, term, watcher, doneCallback) {
    disposeInput(watcher);

    term.write(`\n\n  ${ANSI.dim}Running: ${cmdToRun}...${ANSI.reset}\n`);
    disableMouse(term);
    watcher._mouseEnabled = false;

    try {
        const engine = await import("../../engine.js");
        const res = await engine.executeCommand(cmdToRun);

        if (typeof res === "object" && res?.__watch) {
            watcher._subWatcher = res.watcher;
            res.watcher.start(term, () => {
                watcher._subWatcher = null;
                waitForReturn(term, watcher, doneCallback);
            });
        } else {
            if (res && res !== "__CLEAR__") term.write(`\n${res}\n`);
            waitForReturn(term, watcher, doneCallback);
        }
    } catch (err) {
        term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
        waitForReturn(term, watcher, doneCallback);
    }
}

// ── Post-run Return Prompt ────────────────────────────────────────────

/**
 * Show "press any key" and re-start the menu when user responds.
 */
export function waitForReturn(term, watcher, doneCallback) {
    term.write(`\n  ${ANSI.dim}Press ANY KEY or CLICK to return to Menu...${ANSI.reset}`);
    enableClickMouse(term);

    watcher.onDataDisposable = term.onData((e) => {
        // Ignore hover, scroll, and mouse-release events
        if (e.startsWith("\x1b[<")) {
            const m = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
            if (!m || m[1] === "35" || m[1] === "64" || m[1] === "65" || m[4] === "m") return;
        }

        disposeInput(watcher);
        disableClickMouse(term);
        watcher.start(term, doneCallback);
    });
}
