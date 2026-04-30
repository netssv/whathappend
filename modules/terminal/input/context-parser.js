/**
 * @module modules/terminal/input/context-parser.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - InputEvents from './events.js'
 *     - ContextManager from '../../context.js'
 *     - isIPAddress from '../../formatter.js'
 * - Exports: initContextParser
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

import { InputEvents } from "./events.js";
import { ContextManager } from "../../context.js";
import { isIPAddress } from "../../formatter.js";

let debounceTimer = null;

export function initContextParser() {
    InputEvents.on("EV_INPUT_UPDATED", (buffer) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            evaluateContext(buffer);
        }, 600); // Wait 600ms before evaluating context
    });
}

function evaluateContext(buffer) {
    if (!buffer) return;
    
    const parts = buffer.trim().split(/\s+/);
    if (parts.length === 0) return;

    // Check if the first word or the only word is an IP address
    const possibleIP = parts[parts.length - 1]; // Or just the whole buffer if isolated
    
    // If the entire buffer is an exact IP match
    if (parts.length === 1 && isIPAddress(parts[0])) {
        const currentTarget = ContextManager.getDomain();
        if (currentTarget !== parts[0]) {
            // Instant detection: user typed an IP address
            ContextManager.setManualTarget(parts[0]);
        }
    }
}
