/**
 * @module modules/terminal/triage-interact.js
 * @description Post-triage interactive hover/click watcher.
 *              After Infrastructure Triage finishes, enables mouse tracking
 *              so users can hover over result rows and click to open
 *              verification URLs. Uses a bottom status line to show the
 *              target URL — avoids fragile cursor repositioning.
 *
 * @connections
 * - Imports: ANSI from '../formatter.js', ROW_KEYS from './progressive-renderer.js'
 * - Exports: createTriageWatcher
 * - Layer: Terminal Layer (UI)
 */

import { ANSI } from "../formatter.js";
import { ROW_KEYS } from "./progressive-renderer.js";

/**
 * @param {Object} resolved  — map of rowKey → text value
 * @param {Object} urls      — map of rowKey → verification URL
 * @param {number} skeletonHeight — rows from header to end of skeleton
 */
export function createTriageWatcher(resolved, urls, skeletonHeight) {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            _mouseEnabled: false,
            _currentUrl: null,
            _rowToKey: {},

            start(term, doneCallback) {
                // The cursor is at the bottom of the triage output.
                // Calculate the absolute Y of each row using scrollback base.
                const buf = term.buffer?.active;
                const absBottom = (buf?.baseY ?? 0) + (buf?.cursorY ?? 0);

                // Rows occupy: absBottom - skeletonHeight + 2 (header=1) .. +10
                // header is at absBottom - skeletonHeight + 1
                // first data row (registrar) is header + 1
                const headerY = absBottom - skeletonHeight + 1;

                this._rowToKey = {};
                for (let i = 0; i < ROW_KEYS.length; i++) {
                    this._rowToKey[headerY + 1 + i] = ROW_KEYS[i];
                }

                // Write instruction + status line (cursor stays on status line)
                term.write(`\n  ${ANSI.dim}Hover to highlight · Click to open · ${ANSI.reset}\x1b[31;1m[Q] exit\x1b[0m\n`);
                term.write(`  ${ANSI.dim}↳ —${ANSI.reset}`);
                
                this._qExitY = absBottom + 1;

                term.write("\x1b[?1003h\x1b[?1006h");
                this._mouseEnabled = true;

                this.onDataDisposable = term.onData((e) => {
                    if (e.startsWith("\x1b[<")) {
                        const m = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
                        if (!m) return;
                        const btn = parseInt(m[1]);
                        const mouseY = parseInt(m[3]);
                        const isPress = m[4] === "M";

                        // Convert viewport Y to absolute Y
                        const absY = (term.buffer?.active?.baseY ?? 0) + mouseY;
                        const key = this._rowToKey[absY];

                        // Hover
                        if (btn === 35) {
                            const url = key ? (urls[key] || null) : null;
                            if (url !== this._currentUrl) {
                                this._currentUrl = url;
                                this._updateStatus(term, key, url);
                            }
                            return;
                        }

                        // Left click
                        if (btn === 0 && isPress) {
                            if (absY === this._qExitY) {
                                this._cleanup(term);
                                doneCallback();
                                return;
                            }
                            if (key) {
                                const url = urls[key];
                                if (url) {
                                    try { chrome.tabs.create({ url, active: false }); } catch (_) {}
                                    this._updateStatus(term, key, `${ANSI.green}✓ Opened${ANSI.reset}`);
                                }
                                return;
                            }
                        }
                        return;
                    }

                    // Keyboard quit
                    const lower = e.toLowerCase();
                    if (lower === "q" || e === "\x03" || e === "\r" || e === "\n") {
                        this._cleanup(term);
                        doneCallback();
                    }
                });
            },

            _updateStatus(term, key, urlOrMsg) {
                const cols = term.cols || 80;
                let displayUrl = urlOrMsg || "—";
                
                const displayKey = key ? `${ANSI.cyan}${key}${ANSI.reset} ` : "";
                const prefix = `  ${ANSI.dim}↳${ANSI.reset} ${displayKey}${ANSI.dim}`;
                
                // Prevent wrapping by truncating the URL if necessary
                // Length of "  ↳ key " is 4 + key.length + 1
                const prefixLen = 4 + (key ? key.length + 1 : 0);
                const maxUrlLen = cols - prefixLen - 2; // leave 2 chars padding
                
                if (displayUrl.length > maxUrlLen && maxUrlLen > 10) {
                    displayUrl = displayUrl.substring(0, maxUrlLen - 3) + "...";
                }

                const display = `${prefix}${displayUrl}${ANSI.reset}`;
                // Cursor is always on the status line, just carriage return, clear line, and write
                term.write(`\r\x1b[2K${display}`);
            },

            _cleanup(term) {
                if (this._mouseEnabled) {
                    term.write("\x1b[?1003l\x1b[?1006l");
                    this._mouseEnabled = false;
                }
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
            },

            stop(term) { this._cleanup(term); },
        },
    };
}
