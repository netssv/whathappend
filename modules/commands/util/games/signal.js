/**
 * @module modules/commands/util/games/signal.js
 * @description 🎚️ Signal Interception — Retro oscilloscope puzzle.
 *              Match your wave's amplitude & frequency to the target signal.
 * Controls: ↑/↓ Amplitude | ←/→ Frequency | Q Quit
 */

import { SignalGame } from "./core/signal-game.js";
import { DM, RS } from "./core/signal-ui.js";

/**
 * Game factory adhering to the atomic command contract.
 */
export function cmdSignal() {
    let game = null;
    return {
        __watch: true,
        watcher: {
            start(term, doneCallback) {
                game = new SignalGame(term, doneCallback);
                game.start();
            },
            stop(term) {
                if (game) {
                    game.stop();
                } else if (term) {
                    term.write("\x1b[?25h");
                    term.write(`\n\n  ${DM}[Signal lost]${RS}\n`);
                }
            }
        }
    };
}
