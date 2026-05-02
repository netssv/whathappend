/**
 * @module modules/commands/util/games/signal.js
 * @version 2.7.0
 * @description 🎚️ Signal Interception — Retro oscilloscope puzzle.
 *              Match your wave's amplitude & frequency to the target signal.
 * Controls: ↑/↓ Amplitude | ←/→ Frequency | Q Quit
 */

import { SignalGame, DM, RS } from "./core/signal-game.js";

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
