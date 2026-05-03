/**
 * @module modules/commands/util/tabs-menu.js
 * @description Interactive full-screen tab manager (TUI mode).
 *              Returned as a __watch watcher object consumed by the engine.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', icon from './tabs-utils.js', cmdTabs from './tabs.js'
 * - Exports: createTabMenu
 * - Layer: Command Layer (Util) — stateful UI controller, no Chrome API calls except via cmdTabs.
 */

import { ANSI } from "../../formatter.js";
import { icon, truncate } from "./tabs-utils.js";

/** @typedef {"focus"|"close"|"info"|"diag"|"watch"|"block"|"sleep"} TabMode */

const MODE_LABELS = {
    focus: "Focus (Switch)",
    close: "Close (Kill)",
    info:  "Info (Metadata)",
    diag:  "Diag (Health)",
    watch: "Watch (Live)",
    block: "Block (Network)",
    sleep: "Sleep (Memory)",
};

const MODE_KEYS = { f: "focus", c: "close", i: "info", d: "diag", w: "watch", b: "block", s: "sleep" };

/**
 * Builds the interactive watcher object for the tabs TUI menu.
 * @param {Function} cmdTabs - Reference to the main tabs dispatcher (injected to avoid circular import).
 * @returns {{ __watch: true, watcher: object }}
 */
export function createTabMenu(cmdTabs) {
    return {
        __watch: true,
        watcher: {
            /** @type {import("@xterm/xterm").IDisposable|null} */
            onDataDisposable: null,
            _subWatcher: null,

            start(term, doneCallback) {
                let tabsList = [];
                let message  = "";
                /** @type {TabMode} */
                let currentMode = "focus";

                const fetchAndDraw = () => {
                    chrome.tabs.query({}, (tabs) => {
                        tabsList = tabs;
                        term.write("\x1b[2J\x1b[H");

                        let out = `\n  ${ANSI.bold}${ANSI.cyan}/// TAB MANAGER ///${ANSI.reset}  ${ANSI.dim}${tabs.length} open${ANSI.reset}\n\n`;

                        for (let i = 0; i < Math.min(tabs.length, 9); i++) {
                            const tab = tabs[i];
                            out += `    ${ANSI.bold}[${i + 1}]${ANSI.reset} ${icon(tab)} ${truncate(tab.title, 30)}\n`;
                        }

                        if (tabs.length > 9) {
                            out += `    ${ANSI.dim}...and ${tabs.length - 9} more tabs.${ANSI.reset}\n`;
                        }

                        out += message
                            ? `\n  ${ANSI.yellow}${message}${ANSI.reset}\n`
                            : `\n`;

                        message = "";

                        out += `  ${ANSI.bold}Mode: ${ANSI.yellow}${MODE_LABELS[currentMode]}${ANSI.reset}\n`;
                        out += `  ${ANSI.dim}Actions: [F]ocus [C]lose [I]nfo [D]iag [W]atch [B]lock [S]leep${ANSI.reset}\n`;
                        out += `  ${ANSI.dim}Press 1-9 to apply. 'Q' to quit.${ANSI.reset}\n`;
                        term.write(out);
                    });
                };

                this.onDataDisposable = term.onData(async (e) => {
                    const lower = e.toLowerCase();

                    // Quit
                    if (lower === "q" || e === "\x03" || e === "\r" || e === "\n") {
                        doneCallback();
                        return;
                    }

                    // Mode switch
                    if (MODE_KEYS[lower]) {
                        currentMode = MODE_KEYS[lower];
                        fetchAndDraw();
                        return;
                    }

                    const num = parseInt(lower);
                    if (num >= 1 && num <= 9 && num <= tabsList.length) {
                        // Fast in-menu actions (no full exit)
                        if (currentMode === "focus") {
                            const tabId = tabsList[num - 1].id;
                            chrome.tabs.update(tabId, { active: true });
                            chrome.windows.update(tabsList[num - 1].windowId, { focused: true });
                            message = `Focused tab ${num}.`;
                            fetchAndDraw();
                            return;
                        }
                        if (currentMode === "close") {
                            chrome.tabs.remove(tabsList[num - 1].id, () => {
                                message = `Closed tab ${num}.`;
                                fetchAndDraw();
                            });
                            return;
                        }

                        // All other modes — exit menu, run sub-command, offer return
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                        term.write(`\n\n  ${ANSI.dim}Running: tabs ${currentMode} ${num}...${ANSI.reset}\n`);

                        try {
                            const res = await cmdTabs([currentMode, num.toString()]);

                            if (typeof res === "object" && res?.__watch) {
                                // Hand off to sub-watcher (e.g. tabs watch)
                                this._subWatcher = res.watcher;
                                res.watcher.start(term);

                                this.onDataDisposable = term.onData((subEvent) => {
                                    const subLower = subEvent.toLowerCase();
                                    if (subLower === "q" || subEvent === "\x03") {
                                        this._subWatcher?.stop(term);
                                        this._subWatcher = null;
                                        this.onDataDisposable.dispose();
                                        this.onDataDisposable = null;
                                        this.start(term, doneCallback);
                                    }
                                });
                            } else {
                                // Print result and wait for any key to return
                                term.write(`\n${res}\n`);
                                term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Tabs Menu...${ANSI.reset}`);
                                this.onDataDisposable = term.onData(() => {
                                    this.onDataDisposable.dispose();
                                    this.onDataDisposable = null;
                                    this.start(term, doneCallback);
                                });
                            }
                        } catch (err) {
                            term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                            term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Tabs Menu...${ANSI.reset}`);
                            this.onDataDisposable = term.onData(() => {
                                this.onDataDisposable.dispose();
                                this.onDataDisposable = null;
                                this.start(term, doneCallback);
                            });
                        }
                    }
                });

                fetchAndDraw();
            },

            stop(term) {
                this._subWatcher?.stop(term);
                this._subWatcher = null;
                this.onDataDisposable?.dispose();
                this.onDataDisposable = null;
            }
        }
    };
}
