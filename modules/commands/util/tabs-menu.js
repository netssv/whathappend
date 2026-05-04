/**
 * @module modules/commands/util/tabs-menu.js
 * @description Interactive full-screen tab manager (TUI mode).
 *              Returned as a __watch watcher object consumed by the engine.
 *
 * Architecture:
 *   tabs-menu.js         — Controller (this file): state machine + input routing
 *   tabs-menu-ui.js      — View: pure rendering functions (no side effects)
 *   tabs-menu-actions.js — Actions: Chrome API calls + modal confirmations
 *
 * @connections
 * - Imports: ANSI, renderTabList, renderActionMenu, MODE_KEYS,
 *            handleFocus, handleClose, handleDelegatedAction
 * - Exports: createTabMenu
 * - Layer: Command Layer (Util) — stateful UI controller.
 */

import { ANSI } from "../../formatter.js";
import { renderTabList, renderActionMenu, MODE_KEYS } from "./tabs-menu-ui.js";
import { handleFocus, handleClose, handleDelegatedAction } from "./tabs-menu-actions.js";

// ── Exit keys ────────────────────────────────────────────────────────
const isQuitKey = (e) => e === "q" || e === "Q" || e === "\x03" || e === "\r" || e === "\n";

// ── Helper: safely dispose listener ──────────────────────────────────
function disposeListener(watcher) {
    if (watcher.onDataDisposable) {
        watcher.onDataDisposable.dispose();
        watcher.onDataDisposable = null;
    }
}

// ── Helper: wait for any key, then restart the menu ──────────────────
function waitForKeyThenRestart(watcher, term, doneCallback) {
    term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Tabs Menu...${ANSI.reset}`);
    watcher.onDataDisposable = term.onData(() => {
        disposeListener(watcher);
        watcher.start(term, doneCallback);
    });
}

/**
 * Builds the interactive watcher object for the tabs TUI menu.
 * @param {Function} cmdTabs - Reference to the main tabs dispatcher.
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
                /** @type {chrome.tabs.Tab[]} */
                let tabsList = [];
                let message = "";
                let selectedTabIndex = null;

                // ── Draw: query tabs → render the appropriate screen ─
                const draw = () => {
                    chrome.tabs.query({}, (tabs) => {
                        tabsList = tabs;
                        term.write("\x1b[2J\x1b[H"); // clear screen

                        if (selectedTabIndex === null) {
                            term.write(renderTabList(tabs, message));
                        } else {
                            const tab = tabs[selectedTabIndex];
                            if (!tab) { selectedTabIndex = null; draw(); return; }
                            term.write(renderActionMenu(tab, message));
                        }

                        message = "";
                    });
                };

                // ── Input router ─────────────────────────────────────
                this.onDataDisposable = term.onData(async (e) => {
                    const lower = e.toLowerCase();

                    // Global quit
                    if (isQuitKey(lower)) {
                        disposeListener(this);
                        doneCallback();
                        return;
                    }

                    // ── Level 1: Tab Selection ───────────────────────
                    if (selectedTabIndex === null) {
                        const num = parseInt(lower);
                        if (num >= 1 && num <= 9 && num <= tabsList.length) {
                            selectedTabIndex = num - 1;
                            draw();
                        }
                        return;
                    }

                    // ── Level 2: Action Selection ────────────────────

                    // Back to tab list
                    if (lower === "b") {
                        selectedTabIndex = null;
                        draw();
                        return;
                    }

                    const mode = MODE_KEYS[lower];
                    if (!mode) return;

                    const tab = tabsList[selectedTabIndex];
                    const label = (selectedTabIndex + 1).toString();

                    // ── Fast actions (stay in menu) ──────────────────
                    if (mode === "focus") {
                        const result = await handleFocus(tab, label);
                        message = result.message;
                        selectedTabIndex = null;
                        draw();
                        return;
                    }

                    // ── Modal actions (pause input) ──────────────────
                    if (mode === "close") {
                        disposeListener(this);
                        await handleClose(tab);
                        this.start(term, doneCallback);
                        return;
                    }

                    // ── Delegated actions (sub-commands) ─────────────
                    disposeListener(this);
                    term.write(`\n\n  ${ANSI.dim}Running: tabs ${mode} ${label}...${ANSI.reset}\n`);

                    const result = await handleDelegatedAction(cmdTabs, mode, label);

                    switch (result.type) {
                        case "delegate-watch":
                            this._subWatcher = result.watcher;
                            result.watcher.start(term);

                            this.onDataDisposable = term.onData((subEvent) => {
                                const subLower = subEvent.toLowerCase();
                                if (subLower === "q" || subEvent === "\x03") {
                                    this._subWatcher?.stop(term);
                                    this._subWatcher = null;
                                    disposeListener(this);
                                    this.start(term, doneCallback);
                                }
                            });
                            break;

                        case "delegate-output":
                            term.write(result.output);
                            waitForKeyThenRestart(this, term, doneCallback);
                            break;

                        case "error":
                            term.write(result.output);
                            waitForKeyThenRestart(this, term, doneCallback);
                            break;
                    }
                });

                draw();
            },

            stop(term) {
                this._subWatcher?.stop(term);
                this._subWatcher = null;
                disposeListener(this);
            },
        },
    };
}
