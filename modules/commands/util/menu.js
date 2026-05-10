/**
 * @module modules/commands/util/menu.js
 * @description Thin orchestrator for the Platform Navigator TUI.
 *              Wires together MenuRenderer, SearchRenderer, and the input/runner modules.
 *
 * @connections
 * - Imports: MenuRenderer from './menu-ui.js'
 * - Imports: SearchRenderer from './search-ui.js'
 * - Imports: parseSgrMouse, isQuit, isLeft, isRight, isUp, isDown, isEnter,
 *            isSearch, isEsc, isBack, isPrintable, charToIndex, idxToKey,
 *            carouselPrev, carouselNext, listUp, listDown from './menu-input.js'
 * - Imports: runCommand, waitForReturn, quit, enableHoverMouse, disposeInput from './menu-runner.js'
 * - Imports: CATEGORIES from '../../data/menu-data.js'
 * - Exports: cmdNavMenu
 * - Layer: Command Layer (Util) — entry point / orchestrator.
 */

import { CATEGORIES } from "../../data/menu-data.js";
import { MenuRenderer } from "./menu-ui.js";
import { SearchRenderer } from "./search-ui.js";
import {
    parseSgrMouse, isQuit, isLeft, isRight, isUp, isDown,
    isEnter, isSearch, isEsc, isBack, isPrintable,
    charToIndex, idxToKey, carouselPrev, carouselNext, listUp, listDown,
} from "./menu-input.js";
import { runCommand, quit, enableHoverMouse, disposeInput } from "./menu-runner.js";

// ── Watcher Factory ───────────────────────────────────────────────────

export function cmdNavMenu() {
    return { __watch: true, watcher: createWatcher() };
}

function createWatcher() {
    return {
        // State
        onDataDisposable: null,
        _subWatcher: null,
        _renderer: null,
        _searchRenderer: null,
        _searchMode: false,
        _searchQuery: "",
        _hoveredIdx: -1,
        _mouseEnabled: false,
        clearOnExit: true,

        // ── Lifecycle ─────────────────────────────────────────────────

        start(term, doneCallback) {
            this._renderer        = new MenuRenderer(term);
            this._searchRenderer  = new SearchRenderer(term);
            this._searchMode      = false;
            this._searchQuery     = "";
            this._hoveredIdx      = -1;
            this._renderer.draw(0);

            enableHoverMouse(term);
            this._mouseEnabled = true;
            this.onDataDisposable = term.onData((e) => this._onData(e, term, doneCallback));
        },

        stop(term) {
            if (this._mouseEnabled) { term.write("\x1b[?1003l\x1b[?1006l"); this._mouseEnabled = false; }
            if (this._subWatcher)   { this._subWatcher.stop(term); this._subWatcher = null; }
            disposeInput(this);
        },

        // ── Input Dispatcher ──────────────────────────────────────────

        async _onData(e, term, doneCallback) {
            let lower = e.toLowerCase();

            // 1. Resolve mouse → action string
            const mouse = parseSgrMouse(e, term);
            if (mouse) {
                const handled = this._handleMouse(mouse, term, lower);
                if (handled === null) return; // swallowed (hover/scroll/release)
                lower = handled;              // click → action key
            }

            // 2. Global quit
            if (isQuit(e, lower)) { quit(term, this, doneCallback); return; }

            // 3. Search mode
            if (this._searchMode) { await this._handleSearch(e, term, doneCallback); return; }

            // 4. Carousel ← →
            if (isLeft(e, lower))  { this._carouselNav(carouselPrev(this._renderer.currentCategory, CATEGORIES.length), term); return; }
            if (isRight(e, lower)) { this._carouselNav(carouselNext(this._renderer.currentCategory, CATEGORIES.length), term); return; }

            // 5. List ↑ ↓ with wrap-around
            if (isUp(e))   { const cat = CATEGORIES[this._renderer.currentCategory]; this._listNav(listUp(this._hoveredIdx, cat.commands.length), term); return; }
            if (isDown(e)) { const cat = CATEGORIES[this._renderer.currentCategory]; this._listNav(listDown(this._hoveredIdx, cat.commands.length), term); return; }

            // 6. Enter: run hovered item
            if (isEnter(e) && this._hoveredIdx >= 0) {
                const cmd = CATEGORIES[this._renderer.currentCategory].commands[this._hoveredIdx]?.cmd;
                if (cmd) await runCommand(cmd, term, this, doneCallback);
                return;
            }

            // 7. [/] or [?] → activate search
            if (isSearch(e)) { this._activateSearch(term); return; }

            // 8. Number key (1-9) → run command directly
            //    Any other printable char → activate search pre-seeded with that char
            if (e >= "1" && e <= "9") {
                const idx = charToIndex(e);
                const cat = CATEGORIES[this._renderer.currentCategory];
                if (idx >= 0 && idx < cat.commands.length) {
                    await runCommand(cat.commands[idx].cmd, term, this, doneCallback);
                }
            } else if (isPrintable(e) && e !== "q") {
                this._searchMode  = true;
                this._searchQuery = e;
                this._searchRenderer.update(e);
            }
        },

        // ── Mouse Handler ─────────────────────────────────────────────

        _handleMouse({ btn, x, absY, isPress }, term, lower) {
            const renderer = this._searchMode ? this._searchRenderer : this._renderer;
            const action = renderer.getActionAt(absY, x);

            if (btn === 35) { // hover
                if (!this._searchMode && action !== this._renderer.hoveredAction) {
                    this._renderer.draw(this._renderer.currentCategory, action);
                }
                return null;
            }
            if (btn === 64) { this._renderer.scroll("up");   return null; }
            if (btn === 65) { this._renderer.scroll("down"); return null; }
            if (btn === 0 && isPress && action) return action;
            return null;
        },

        // ── Carousel ─────────────────────────────────────────────────

        _carouselNav(catIdx, term) {
            this._hoveredIdx = -1;
            this._renderer.draw(catIdx);
        },

        // ── List Navigation ───────────────────────────────────────────

        _listNav(newIdx, term) {
            this._hoveredIdx = newIdx;
            this._renderer.draw(this._renderer.currentCategory, idxToKey(newIdx));
        },

        // ── Search ────────────────────────────────────────────────────

        _activateSearch(term) {
            this._searchMode  = true;
            this._searchQuery = "";
            this._searchRenderer.update("");
        },

        async _handleSearch(e, term, doneCallback) {
            if (isEsc(e) || (isBack(e) && this._searchQuery.length === 0)) {
                this._searchMode = false;
                this._renderer.draw(this._renderer.currentCategory);
                return;
            }
            if (isBack(e)) {
                this._searchQuery = this._searchQuery.slice(0, -1);
                this._searchRenderer.update(this._searchQuery);
                return;
            }
            if (e >= "1" && e <= "9") {
                const cmd = this._searchRenderer.getResultCmd(e);
                if (cmd) { this._searchMode = false; await runCommand(cmd, term, this, doneCallback); }
                return;
            }
            if (isPrintable(e)) {
                this._searchQuery += e;
                this._searchRenderer.update(this._searchQuery);
            }
        },
    };
}
