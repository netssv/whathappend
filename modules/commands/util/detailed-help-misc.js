/**
 * @module modules/commands/util/detailed-help-misc.js
 * @description Help entries for system, fun, and administrative commands.
 *              (reload, refresh, about, clear, help, sudo, fullscreen,
 *               matrix, coffee, dog, snake, hack)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: MISC_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const MISC_HELP = {
    reload: () => formatHelp({ name: "reload", syntax: "", descLines: [
        "Extension hard reboot.",
        "Calls chrome.runtime.reload() to restart the extension context.",
        "Use this when the background worker hangs, crashes, or is unresponsive.",
    ], aliases: "restart, reboot", examples: [{ cmd: "reload" }] }),

    refresh: () => formatHelp({ name: "refresh", syntax: "", descLines: [
        "Reload the active browser tab (equivalent to pressing F5).",
        "Useful for applying network block rules or re-testing modifications.",
    ], aliases: "f5, ref", examples: [
        { cmd: "refresh" },
        { cmd: "f5" },
    ] }),

    about: () => formatHelp({ name: "about", syntax: "", descLines: [
        "Philosophy and identity.",
        "Modular web audit tool for infrastructure analysts.",
        "Atomic architecture. Zero-cloud. Privacy by design.",
    ], aliases: null, examples: [{ cmd: "about" }] }),

    clear: () => formatHelp({ name: "clear", syntax: "", descLines: [
        "Clear the terminal screen. Also available via Ctrl+L.",
    ], aliases: "cls, reset", examples: [{ cmd: "clear" }] }),

    help: () => formatHelp({ name: "help", syntax: "", descLines: [
        "Show the interactive command list.",
        "Add ? to any command name for detailed help: email?  ssl?  ip-spoof?",
    ], aliases: "ls, commands, man, ?", examples: [{ cmd: "help" }] }),

    sudo: () => formatHelp({ name: "sudo", syntax: "", descLines: [
        "Gain elevated session privileges.",
        "",
        "WHAT IS IT?",
        "  Required before running restricted commands that modify browser behavior.",
        "  Restricted commands: ip-spoof, geo, useragent, mobile, throttle.",
        "",
        "REAL USE CASES:",
        "  - Run 'sudo' once per session to unlock emulation tools.",
        "  - Use 'sudo --list' to see all commands that require elevation.",
        "  - Privilege resets when the extension is reloaded.",
    ], aliases: "su", examples: [
        { cmd: "sudo" },
        { cmd: "sudo --list", desc: "List restricted commands" },
    ] }),

    fullscreen: () => formatHelp({ name: "fullscreen", syntax: "", descLines: [
        "Toggle the browser window fullscreen state.",
        "Uses Chrome's native window API (equivalent to pressing F11).",
    ], aliases: "fs, f11", examples: [
        { cmd: "fullscreen" },
        { cmd: "f11" },
    ] }),

    matrix: () => formatHelp({ name: "matrix", syntax: "", descLines: [
        "Activate a code rain visual overlay for approximately 6 seconds.",
        "Renders cascading katakana and hex glyphs using the current theme color.",
    ], aliases: "rain", examples: [{ cmd: "matrix" }] }),

    coffee: () => formatHelp({ name: "coffee", syntax: "[minutes]", descLines: [
        "Pomodoro break timer with an ASCII coffee cup animation.",
        "The cup drains over the specified duration.",
        "Sends a browser notification when the break ends.",
        "Press Ctrl+C to cancel early.",
    ], aliases: "break, pomodoro", examples: [
        { cmd: "coffee",    desc: "5-minute micro-break" },
        { cmd: "coffee 25", desc: "25-minute Pomodoro session" },
    ] }),

    dog: () => formatHelp({ name: "dog", syntax: "", descLines: [
        "ASCII dog animation. A reminder to take a walk.",
        "Press Ctrl+C to stop.",
    ], aliases: "perro, mascota, pet", examples: [
        { cmd: "dog" },
        { cmd: "perro" },
    ] }),

    snake: () => formatHelp({ name: "snake", syntax: "", descLines: [
        "Classic Snake game in the terminal.",
        "Use WASD or Arrow Keys to move. Q to quit. R to restart.",
    ], aliases: "juego, game, play", examples: [
        { cmd: "snake" },
        { cmd: "play" },
    ] }),

    hack: () => formatHelp({ name: "hack", syntax: "[level] [--timer]", descLines: [
        "Technical trivia quiz covering DNS, HTTP, SEO, and web security.",
        "10 multiple-choice questions. 4 difficulty levels: junior, mid, senior, random.",
        "Add --timer to enable a 15-second countdown per question.",
    ], aliases: "trivia, quiz", examples: [
        { cmd: "hack" },
        { cmd: "hack random --timer" },
        { cmd: "trivia mid" },
    ] }),
};
