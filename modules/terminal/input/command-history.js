/**
 * @module modules/terminal/input/command-history.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - InputEvents from './events.js'
 * - Exports: initCommandHistory
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

import { InputEvents } from "./events.js";

const HISTORY_KEY = "wh_cmd_history";
const MAX_HISTORY = 100;

let commandHistory = [];
let historyIndex = -1;

export function initCommandHistory() {
    // Load from localStorage (synchronous, 0ms delay for UI fluidity)
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
            commandHistory = JSON.parse(stored);
        }
    } catch (_) {
        commandHistory = [];
    }

    InputEvents.on(InputEvents.EV_COMMAND_SUBMIT, (input) => {
        if (!input) return;
        
        if (commandHistory.length === 0 || commandHistory[0] !== input) {
            commandHistory.unshift(input);
            if (commandHistory.length > MAX_HISTORY) {
                commandHistory.pop();
            }
            saveHistory();
        }
        
        // Reset index on submit
        historyIndex = -1;
    });

    InputEvents.on(InputEvents.EV_HISTORY_NAVIGATE, (direction) => {
        if (direction === "UP") {
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                historyIndex++;
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, commandHistory[historyIndex]);
            }
        } else if (direction === "DOWN") {
            if (historyIndex > 0) {
                historyIndex--;
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, commandHistory[historyIndex]);
            } else if (historyIndex === 0) {
                historyIndex = -1;
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, ""); // Clear line
            }
        }
    });

    // Reset index on other buffer changes (typing, paste, tab)
    InputEvents.on(InputEvents.EV_KEY_TYPED, () => historyIndex = -1);
    InputEvents.on(InputEvents.EV_PASTE_TEXT, () => historyIndex = -1);
}

function saveHistory() {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(commandHistory));
    } catch (_) {}
}
