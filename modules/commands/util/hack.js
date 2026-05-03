/**
 * @module modules/commands/util/hack.js
 * @description Technical trivia game covering DNS, SEO, Web Security, and Recon.
 *              Supports 4 difficulty levels: Junior, Mid, Senior, Random.
 *              Usage: hack [junior|mid|senior|random] [--timer] [seconds]
 */

import { TRIVIA_LEVELS } from "../../data/trivia-data.js";
import { buildLevelPicker, buildTriviaWatcher } from "./hack-engine.js";

/**
 * Entry point for the hack command.
 */
export function cmdHack(args = []) {
    let levelArg = "";
    let timerSeconds = 0;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i].toLowerCase();
        if (arg === "--timer" || arg === "timer") {
            timerSeconds = 15; // default if mentioned but no number
        } else if (!isNaN(parseInt(arg))) {
            timerSeconds = parseInt(arg);
        } else if (TRIVIA_LEVELS[arg]) {
            levelArg = arg;
        }
    }

    if (levelArg) {
        return buildTriviaWatcher(levelArg, timerSeconds);
    }
    return buildLevelPicker(timerSeconds);
}
