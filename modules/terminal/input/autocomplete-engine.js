/**
 * @module modules/terminal/input/autocomplete-engine.js
 * @description Tab-completion orchestrator for the terminal input line.
 *
 * Delegates to strategy functions in autocomplete-strategies.js.
 * Manages tab-cycle state and event wiring.
 *
 * @connections
 * - Imports: InputEvents, autocomplete-strategies
 * - Exports: initAutocompleteEngine
 * - Layer: Terminal Layer (Input)
 */

import { InputEvents } from "./events.js";
import { AVAILABLE_COMMANDS } from "../../data/autocomplete-data.js";
import {
    tryDomainFill, tryDomainFlags, trySubcommand,
    tryConfigValue, tryTabDomains, trySnippet,
    tryCommandCompletion,
} from "./autocomplete-strategies.js";

// ── Tab-cycle state (shared with strategies via reference) ───────────────────

const cycleState = { matches: [], index: -1 };

function resetCycle() {
    cycleState.matches = [];
    cycleState.index = -1;
}

// ── Engine entry point ───────────────────────────────────────────────────────

export function initAutocompleteEngine() {
    InputEvents.on(InputEvents.EV_TAB_PRESSED, async (currentLine) => {
        const input = currentLine.trimStart();
        if (!input) return;

        // Continue cycling if already in a tab-cycle
        if (cycleState.matches.length > 0) {
            cycleState.index = (cycleState.index + 1) % cycleState.matches.length;
            InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, cycleState.matches[cycleState.index]);
            return;
        }

        const parts = input.trim().split(/\s+/);
        const hasTrailingSpace = input.endsWith(" ");
        const baseCmd = parts[0].toLowerCase();
        const commandMatches = AVAILABLE_COMMANDS.filter(c => c.startsWith(baseCmd));

        // Run strategies in priority order (first match wins)
        if (tryDomainFill(parts, hasTrailingSpace, commandMatches)) return;
        if (tryDomainFlags(parts, hasTrailingSpace, cycleState)) return;
        if (trySubcommand(parts, baseCmd, cycleState)) return;
        if (tryConfigValue(parts, baseCmd, hasTrailingSpace, cycleState)) return;
        if (await tryTabDomains(parts, baseCmd, hasTrailingSpace, cycleState)) return;
        if (trySnippet(input, cycleState)) return;

        // Fallback: general command completion (single-word input only)
        if (parts.length === 1 && !hasTrailingSpace) {
            await tryCommandCompletion(input, cycleState);
        }
    });

    // Reset tab-cycle on any non-tab input
    InputEvents.on(InputEvents.EV_KEY_TYPED, resetCycle);
    InputEvents.on(InputEvents.EV_PASTE_TEXT, resetCycle);
    InputEvents.on(InputEvents.EV_HISTORY_NAVIGATE, resetCycle);
}
