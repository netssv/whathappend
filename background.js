/**
 * Handles all network requests from the side panel terminal to avoid CORS
 * restrictions. Routes messages to the appropriate fetch handler and returns
 * raw response data.
 *
 * All requests use AbortController with timeouts to prevent hanging.
 * Supports abort-id for Ctrl+C cancellation from the terminal.
 *
 * Includes Active Tab Tracking for context-aware domain detection.
 */

import { setupTabTracker } from "./modules/background/tab-tracker.js";
import { setupRouter } from "./modules/background/router.js";

// ---------------------------------------------------------------------------
// Side Panel Registration
// ---------------------------------------------------------------------------

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ---------------------------------------------------------------------------
// Keyboard Shortcuts (Registered first for reliability)
// ---------------------------------------------------------------------------

/** Map manifest command IDs → terminal commands */
const SHORTCUT_COMMANDS = {
    "run-start": "start",
    "run-flush": "flush",
    "run-watch": "watch",
    "run-clear": "clear",
    "run-clip":  "clip",
};

chrome.commands.onCommand.addListener((command) => {
    if (command === "reload-extension") {
        chrome.runtime.reload();
        return;
    }

    const termCmd = SHORTCUT_COMMANDS[command];
    if (termCmd) {
        // Forward to side panel terminal
        chrome.runtime.sendMessage({
            type: "shortcut-command",
            command: termCmd,
        }).catch(() => {
            // Side panel may not be open — silently ignore
        });
    }
});

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

setupTabTracker();
setupRouter();

