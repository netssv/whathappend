/**
 * @module modules/terminal/input/index.js
 * @description Orchestrates input sub-modules and wires event handlers.
 *
 * @connections
 * - Imports:
 *     - InputEvents from './events.js'
 *     - initKeyboardEvents, setKeyboardLock, setLine from './keyboard-events.js'
 *     - initCommandHistory from './command-history.js'
 *     - initAutocompleteEngine from './autocomplete-engine.js'
 *     - initClipboardHandler from './clipboard-handler.js'
 *     - initContextParser from './context-parser.js'
 *     - processCommand, getAbortId, setAbortId, getProcessing, setProcessing, getWatcher, setWatcher from './command-runner.js'
 *     - term, writePrompt from '../terminal-ui.js'
 *     - pingTriadVisibility from '../header/header-triad.js'
 * - Exports: initInputManager, isCommandProcessing
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

import { InputEvents } from "./events.js";
import { initKeyboardEvents, setKeyboardLock, setLine } from "./keyboard-events.js";
import { initCommandHistory } from "./command-history.js";
import { initAutocompleteEngine } from "./autocomplete-engine.js";
import { initClipboardHandler } from "./clipboard-handler.js";
import { initContextParser } from "./context-parser.js";

import {
    processCommand,
    getAbortId, setAbortId,
    getProcessing, setProcessing,
    getWatcher, setWatcher,
} from "./command-runner.js";

import { term, writePrompt } from "../terminal-ui.js";
import { pingTriadVisibility } from "../header/header-triad.js";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initInputManager() {
    // 1. Initialize Sub-Modules
    initKeyboardEvents();
    initCommandHistory();
    initAutocompleteEngine();
    initClipboardHandler();
    initContextParser();

    // 2. Orchestrate Sub-Module Events
    InputEvents.on(InputEvents.EV_COMMAND_SUBMIT, async (input) => {
        pingTriadVisibility();
        if (!input || input.trim() === "") {
            writePrompt();
            return;
        }
        await processCommand(input);
    });

    InputEvents.on(InputEvents.EV_INTERRUPT, () => {
        // Stop any active live watcher first
        const watcher = getWatcher();
        if (watcher) {
            watcher.stop();
            setWatcher(null);
            setProcessing(false);
            setKeyboardLock(false);
            term.write("\r\n\x1b[33m^C [Stopped]\x1b[0m\r\n");
            writePrompt();
            return;
        }
        if (getProcessing()) {
            const abortId = getAbortId();
            if (abortId) {
                chrome.runtime.sendMessage({ command: "abort", payload: { abortId } }).catch(() => {});
                setAbortId(null);
            }
            setProcessing(false);
            setKeyboardLock(false);
            term.write("\r\n\x1b[33m^C [Interrupted]\x1b[0m\r\n");
            writePrompt();
        } else {
            term.write("^C\r\n");
            setLine("");
            writePrompt();
        }
    });
}

export function isCommandProcessing() {
    return getProcessing();
}
