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
import { MODE_KEYS, TabsMenuRenderer } from "./tabs-menu-ui.js";
import { handleFocus, handleClose, handleDelegatedAction } from "./tabs-menu-actions.js";
import { disposeListener, waitForKeyThenRestart } from "./tabs-utils.js";

// ── Exit keys ────────────────────────────────────────────────────────
const isQuitKey = (e) => e === "q" || e === "Q" || e === "\x03" || e === "\r" || e === "\n";

/**
 * Builds the interactive watcher object for the tabs TUI menu.
 * @param {Function} cmdTabs - Reference to the main tabs dispatcher.
 * @returns {{ __watch: true, watcher: object }}
 */
export function createTabMenu(cmdTabs) {
    return {
        __watch: true,
        watcher: {
            clearOnExit: true,
            /** @type {import("@xterm/xterm").IDisposable|null} */
            onDataDisposable: null,
            _subWatcher: null,

            start(term, doneCallback) {
                /** @type {chrome.tabs.Tab[]} */
                let tabsList = [];
                let message = "";
                let selectedTabIndex = null;
                let _mouseEnabled = false;
                let renderer = new TabsMenuRenderer(term);

                // ── Draw: query tabs → render the appropriate screen ─
                const draw = () => {
                    chrome.tabs.query({}, (tabs) => {
                        tabsList = tabs;
                        renderer.draw(tabsList, selectedTabIndex, message, renderer.hoveredAction);
                        message = "";
                    });
                };

                // Enable All Motion SGR Mouse Tracking (clicks + hover)
                term.write("\x1b[?1003h\x1b[?1006h");
                _mouseEnabled = true;

                // ── Input router ─────────────────────────────────────
                this.onDataDisposable = term.onData(async (e) => {
                    let lower = e.toLowerCase();

                    // Parse SGR Mouse Event: \x1b[<b;x;yM
                    if (e.startsWith("\x1b[<")) {
                        const match = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
                        if (match) {
                            const btn = parseInt(match[1]);
                            const x = parseInt(match[2]);
                            const rawY = parseInt(match[3]);
                            const isPress = match[4] === 'M';
                            // Convert viewport Y to absolute buffer Y (scroll offset)
                            const absY = (term.buffer?.active?.baseY ?? 0) + rawY;
                            let action = renderer.getActionAt(absY, x);

                            // Hover
                            if (btn === 35) {
                                if (action !== renderer.hoveredAction) {
                                    renderer.hoveredAction = action || null;
                                    renderer.draw(tabsList, selectedTabIndex, message, renderer.hoveredAction);
                                }
                                return;
                            }

                            // Left click press
                            if (btn === 0 && isPress) {
                                if (action) lower = action;
                                else return; // Empty space
                            } else {
                                return; // Ignore release
                            }
                        }
                    }

                    // Global quit
                    if (isQuitKey(lower)) {
                        disposeListener(this);
                        term.clear();
                        import("../../terminal-ui.js").then(ui => ui.showBanner());
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
                    if (_mouseEnabled) {
                        term.write("\x1b[?1003l\x1b[?1006l");
                        _mouseEnabled = false;
                    }
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
                term.write("\x1b[?1003l\x1b[?1006l");
                this._subWatcher?.stop(term);
                this._subWatcher = null;
                disposeListener(this);
            },
        },
    };
}
