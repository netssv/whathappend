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
            clearOnExit: true,
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
                        
                        // Clear the menu from the screen to prevent "dead UI" confusion
                        term.clear();
                        import("../../terminal-ui.js").then(ui => ui.showBanner());
                        
                        doneCallback();
                        return;
                    }

                    function charToIndex(c) {
                        if (c >= '1' && c <= '9') return parseInt(c) - 1;
                        if (c >= 'a' && c <= 'z') return c.charCodeAt(0) - 97 + 9;
                        return -1;
                    }

                    if (this._renderer.currentCategory === -1) {
                        // In Root Menu
                        const idx = charToIndex(lower);
                        if (idx >= 0 && idx < CATEGORIES.length) {
                            this._renderer.draw(idx);
                        }
                    } else {
                        // In Sub Menu
                        if (lower === "b" || lower === "back" || e === "\x1b") { // allow ESC to go back
                            this._renderer.draw(-1);
                            return;
                        }

                        const cat = CATEGORIES[this._renderer.currentCategory];
                        const idx = charToIndex(lower);
                        if (idx >= 0 && idx < cat.commands.length) {
                            const cmdToRun = cat.commands[idx].cmd;

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
                                        this._waitForReturn(term, doneCallback);
                                    });
                                } else {
                                    if (res && res !== "__CLEAR__") {
                                        term.write(`\n${res}\n`);
                                    }
                                    this._waitForReturn(term, doneCallback);
                                }
                            } catch (err) {
                                term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                                this._waitForReturn(term, doneCallback);
                            }
                            }
                        }
                    });
                },

                _waitForReturn(term, doneCallback) {
                    term.write(`\n  ${ANSI.dim}Press ANY KEY or CLICK to return to Menu...${ANSI.reset}`);
                    // Enable basic mouse click tracking (no hover) so clicks are captured
                    term.write("\x1b[?1000h\x1b[?1006h");
                    
                    this.onDataDisposable = term.onData((e) => {
                        // Filter out non-click mouse events (hovers, scrolls, releases)
                        if (e.startsWith("\x1b[<")) {
                            const m = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
                            if (!m || m[1] === "35" || m[1] === "64" || m[1] === "65" || m[4] === "m") {
                                return; // Ignore and keep waiting
                            }
                        }
                        
                        if (this.onDataDisposable) this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                        term.write("\x1b[?1000l\x1b[?1006l"); // disable basic tracking
                        this.start(term, doneCallback);
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
