/**
 * @module modules/commands/util/coffee.js
 * @description Pomodoro-style break timer with draining ASCII coffee cup.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - getCup, formatTime, getPomodoroTip, startAlarmChime, startFlash from './core/coffee-ui.js'
 * - Exports: cmdCoffee
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { getCup, formatTime, getPomodoroTip, startAlarmChime, startFlash } from "./core/coffee-ui.js";

// ===================================================================
//  coffee — Pomodoro break timer with draining ASCII coffee cup
//
//  Best-practice defaults:
//    coffee         → 5 min  (micro-break: stretch, eyes rest)
//    coffee 10      → 10 min (short break: walk, hydrate)
//    coffee 15      → 15 min (medium break: snack, fresh air)
//    coffee 25      → 25 min (pomodoro work session)
//    coffee stop    → Cancel active timer
// ===================================================================

export function cmdCoffee(args) {
    // ── Parse duration ──
    const validDurations = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60];
    let minutes = 5; // default micro-break

    if (args[0]) {
        const parsed = parseInt(args[0], 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 60) {
            return `${ANSI.yellow}Duration must be 1-60 minutes.${ANSI.reset}\n  ${ANSI.dim}Recommended: ${validDurations.slice(0, 8).join(", ")} min${ANSI.reset}`;
        }
        minutes = parsed;
    }

    const totalSeconds = minutes * 60;
    const tip = getPomodoroTip(minutes);

    // Cup (10 lines) + blank + label + tip + ctrl-c + blank + time = 16
    const LINES = 16;

    return {
        __watch: true,
        watcher: {
            intervalId: null,
            _alarm: null,
            _flash: null,
            start: function(term, doneCallback) {
                this.term = term;
                const endTime = Date.now() + totalSeconds * 1000;
                let tick = 0;
                let steamFrame = 0;
                let alarmStarted = false;

                const render = () => {
                    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                    const elapsed = totalSeconds - remaining;
                    const progress = elapsed / totalSeconds;
                    const level = Math.min(4, Math.floor(progress * 5));

                    // Change steam every tick for animation
                    steamFrame = (steamFrame + 1) % 2;

                    // Move cursor back up to overwrite previous frame
                    if (tick > 0) term.write(`\x1b[${LINES}A`);

                    const cup = getCup(level, steamFrame);
                    const timeColor = remaining <= 10 && remaining > 0
                        ? (remaining % 2 === 0 ? ANSI.yellow : ANSI.red)
                        : ANSI.bold;

                    const lines = [
                        ...cup,
                        ``,
                        `  ${ANSI.bold}${ANSI.cyan}Break Timer${ANSI.reset} ${ANSI.dim}— ${minutes} min${ANSI.reset}`,
                        `  ${ANSI.dim}${tip}${ANSI.reset}`,
                        `  ${ANSI.dim}Press ${ANSI.white}Ctrl+C${ANSI.dim} to cancel.${ANSI.reset}`,
                        ``,
                        `  ${timeColor}${formatTime(remaining)}${ANSI.reset}`,
                    ];

                    for (const l of lines) {
                        term.write(`\x1b[2K\r${l}\r\n`);
                    }

                    tick++;

                    // ── Timer complete — enter alarm mode ──
                    if (remaining <= 0 && !alarmStarted) {
                        alarmStarted = true;

                        // Stop the countdown interval (no more redraws)
                        clearInterval(this.intervalId);
                        this.intervalId = null;

                        // Write completion message (below the last frame)
                        term.writeln("");
                        term.writeln(`  ${ANSI.green}${ANSI.bold}✓ Break complete!${ANSI.reset} ${ANSI.dim}${minutes} min${ANSI.reset}`);
                        term.writeln(`  ${ANSI.dim}Time to get back to work. 🚀${ANSI.reset}`);
                        term.writeln(`  ${ANSI.bold}${ANSI.yellow}Press Ctrl+C to dismiss${ANSI.reset}`);
                        term.writeln("");

                        // Start persistent alarm chime (repeats until Ctrl+C)
                        this._alarm = startAlarmChime();

                        // Start visual flash on the terminal container
                        this._flash = startFlash();

                        // Chrome notification
                        try {
                            if (chrome.notifications && chrome.notifications.create) {
                                chrome.notifications.create("wh-coffee-done", {
                                    type: "basic",
                                    iconUrl: "icons/icon128.png",
                                    title: "Break Over ☕",
                                    message: `Your ${minutes}-minute break is done. Back to work!`,
                                });
                            }
                        } catch (_) {}
                    }
                };

                term.writeln(""); // initial padding
                render();
                this.intervalId = setInterval(render, 1000);
            },
            stop: function() {
                // Stop countdown interval
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                // Stop alarm chime
                if (this._alarm) {
                    this._alarm.stop();
                    this._alarm = null;
                }
                // Stop visual flash
                if (this._flash) {
                    this._flash.stop();
                    this._flash = null;
                }
            }
        }
    };
}
