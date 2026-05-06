/**
 * @module modules/commands/util/menu.js
 * @description General interactive navigation menu for discovering platform commands.
 */

import { ANSI } from "../../formatter.js";
import { CATEGORIES } from "../../data/menu-data.js";
import { MenuRenderer } from "./menu-ui.js";

export function cmdNavMenu() {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            _subWatcher: null,
            _renderer: null,
            _mouseEnabled: false,

            start(term, doneCallback) {
                this._renderer = new MenuRenderer(term);
                this._renderer.draw(-1);

                // Enable All Motion SGR Mouse Tracking (clicks + hover)
                term.write("\x1b[?1003h\x1b[?1006h");
                this._mouseEnabled = true;
                this.onDataDisposable = term.onData(async (e) => {
                    let lower = e.toLowerCase();

                    // Parse SGR Mouse Event: \x1b[<b;x;yM or m
                    if (e.startsWith("\x1b[<")) {
                        const match = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
                        if (match) {
                            const btn = parseInt(match[1]);
                            const x = parseInt(match[2]);
                            const rawY = parseInt(match[3]);
                            const isPress = match[4] === 'M';
                            // Convert viewport Y to absolute buffer Y (scroll offset)
                            const absY = (term.buffer?.active?.baseY ?? 0) + rawY;
                            const action = this._renderer.getActionAt(absY, x);

                            // Mouse Move (hover)
                            if (btn === 35) {
                                if (action !== this._renderer.hoveredAction) {
                                    this._renderer.draw(this._renderer.currentCategory, action);
                                }
                                return;
                            }

                            // Left click press
                            if (btn === 0 && isPress) {
                                if (action) lower = action;
                                else return;
                            } else {
                                return; // Ignore release or drag
                            }
                        }
                    }

                    // Quit
                    if (lower === "q" || e === "\x03") {
                        if (this.onDataDisposable) {
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                        }
                        doneCallback();
                        return;
                    }

                    if (this._renderer.currentCategory === -1) {
                        // In Root Menu
                        const num = parseInt(lower);
                        if (num >= 1 && num <= CATEGORIES.length) {
                            this._renderer.draw(num - 1);
                        }
                    } else {
                        // In Sub Menu
                        if (lower === "b" || lower === "back") {
                            this._renderer.draw(-1);
                            return;
                        }

                        const cat = CATEGORIES[this._renderer.currentCategory];
                        const num = parseInt(lower);
                        if (num >= 1 && num <= cat.commands.length) {
                            const cmdToRun = cat.commands[num - 1].cmd;

                            // Clean up this watcher temporarily to run the command
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                            term.write(`\n\n  ${ANSI.dim}Running: ${cmdToRun}...${ANSI.reset}\n`);

                            // Disable mouse tracking during command execution
                            if (this._mouseEnabled) {
                                term.write("\x1b[?1003l\x1b[?1006l");
                                this._mouseEnabled = false;
                            }

                            try {
                                const engine = await import("../../engine.js");
                                const res = await engine.executeCommand(cmdToRun);

                                if (typeof res === "object" && res?.__watch) {
                                    this._subWatcher = res.watcher;
                                    res.watcher.start(term, () => {
                                        this._subWatcher = null;
                                        // Some watchers (like ext) print output before calling doneCallback.
                                        // Wait for ANY KEY so the user can read the output.
                                        term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                        this.onDataDisposable = term.onData(() => {
                                            if (this.onDataDisposable) this.onDataDisposable.dispose();
                                            this.onDataDisposable = null;
                                            this.start(term, doneCallback);
                                        });
                                    });
                                } else {
                                    if (res && res !== "__CLEAR__") {
                                        term.write(`\n${res}\n`);
                                    }
                                    term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                    this.onDataDisposable = term.onData(() => {
                                        if (this.onDataDisposable) this.onDataDisposable.dispose();
                                        this.onDataDisposable = null;
                                        this.start(term, doneCallback);
                                    });
                                }
                            } catch (err) {
                                term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                                term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                this.onDataDisposable = term.onData(() => {
                                    if (this.onDataDisposable) this.onDataDisposable.dispose();
                                    this.onDataDisposable = null;
                                    this.start(term, doneCallback);
                                });
                            }
                        }
                    }
                });
            },

            stop(term) {
                if (this._mouseEnabled) {
                    term.write("\x1b[?1003l\x1b[?1006l");
                    this._mouseEnabled = false;
                }
                if (this._subWatcher) {
                    this._subWatcher.stop(term);
                    this._subWatcher = null;
                }
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
            }
        }
    };
}
