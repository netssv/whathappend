/**
 * @module modules/commands/util/help.js
 * @description Interactive Help TUI (carousel + compact) + flag-based text output.
 *              Mirrors menu.js architecture: shared input helpers, runner, search.
 *
 * @connections
 * - Imports: HelpRenderer, HELP_CATEGORIES from './help-ui.js'
 * - Imports: SearchRenderer from './search-ui.js'
 * - Imports: handleSearchInput, handleSearchMouseHover from './search-controller.js'
 * - Imports: menu-input.js helpers
 * - Imports: quit, enableHoverMouse, disposeInput from './menu-runner.js'
 * - Imports: renderTextHelp from './help-text.js'
 * - Exports: cmdHelp
 * - Layer: Command Layer (Util) — entry point + watcher orchestrator.
 */

import { HelpRenderer, HELP_CATEGORIES } from "./help-ui.js";
import { SearchRenderer } from "./search-ui.js";
import { renderTextHelp } from "./help-text.js";
import { handleSearchInput, handleSearchMouseHover } from "./search-controller.js";
import {
    parseSgrMouse, isQuit, isLeft, isRight, isUp, isDown,
    isEnter, isSearch, isPrintable,
    charToIndex, idxToKey, carouselPrev, carouselNext, listUp, listDown,
} from "./menu-input.js";
import { quit, enableHoverMouse, disposeInput } from "./menu-runner.js";
import { showCommandDoc } from "./help-runner.js";

// ── Public Entry Point ────────────────────────────────────────────────

export function cmdHelp(args = [], flags = []) {
    let query = "";
    if (flags.length > 0 && flags[0].startsWith("-")) {
        query = flags[0].replace(/^-+/, "").toLowerCase();
    } else if (args.length > 0) {
        query = args[0].toLowerCase();
    }
    return query ? renderTextHelp(query) : { __watch: true, watcher: createWatcher() };
}

// ── Watcher Factory ───────────────────────────────────────────────────

function createWatcher() {
    return {
        onDataDisposable: null,
        _renderer: null,
        _searchRenderer: null,
        _searchState: { mode: false, query: "" },
        _hoveredIdx: -1,
        _mouseEnabled: false,
        clearOnExit: true,

        // ── Lifecycle ─────────────────────────────────────────────────

        start(term, doneCallback) {
            this._renderer       = new HelpRenderer(term);
            this._searchRenderer = new SearchRenderer(term);
            this._searchState    = { mode: false, query: "" };
            this._hoveredIdx     = -1;
            this._renderer.draw(0);
            enableHoverMouse(term);
            this._mouseEnabled = true;
            this.onDataDisposable = term.onData((e) => this._onData(e, term, doneCallback));
        },

        stop(term) {
            if (this._mouseEnabled) { term.write("\x1b[?1003l\x1b[?1006l"); this._mouseEnabled = false; }
            disposeInput(this);
        },

        // ── Input Dispatcher ──────────────────────────────────────────

        async _onData(e, term, doneCallback) {
            let lower = e.toLowerCase();

            // 1. Resolve mouse → action string
            const mouse = parseSgrMouse(e, term);
            if (mouse) {
                const handled = this._handleMouse(mouse);
                if (handled === null) return;
                lower = handled;
            }

            // 2. Global quit
            if (isQuit(e, lower)) { quit(term, this, doneCallback); return; }

            // 3. Search mode — delegate entirely to shared controller
            if (this._searchState.mode) {
                await handleSearchInput(e, lower, term, doneCallback, {
                    state: this._searchState,
                    searchRenderer: this._searchRenderer,
                    mainRenderer: this._renderer,
                    onExecute: (cmd, t, cb) => showCommandDoc(cmd, t, this, cb),
                });
                return;
            }

            // 4. Carousel ← →
            if (isLeft(e, lower))  { this._carouselNav(carouselPrev(this._renderer.currentSection, HELP_CATEGORIES.length)); return; }
            if (isRight(e, lower)) { this._carouselNav(carouselNext(this._renderer.currentSection, HELP_CATEGORIES.length)); return; }

            // 5. List ↑ ↓
            if (isUp(e))   { this._listNav(listUp(this._hoveredIdx,   this._renderer.getSectionCommandCount())); return; }
            if (isDown(e)) { this._listNav(listDown(this._hoveredIdx, this._renderer.getSectionCommandCount())); return; }

            // 6. Enter: open hovered command doc
            if (isEnter(e) && this._hoveredIdx >= 0) {
                const cmd = this._renderer.getCommandAt(this._hoveredIdx);
                if (cmd) await showCommandDoc(cmd, term, this, doneCallback);
                return;
            }

            // 7. [/] or [?] → activate search
            if (isSearch(e)) { this._activateSearch(); return; }

            // 8. Number / click → open doc; printable char → seed search
            const actionIdx = charToIndex(lower);
            if ((e >= "1" && e <= "9") || (actionIdx !== -1 && !isPrintable(e))) {
                const cmd = this._renderer.getCommandAt(actionIdx);
                if (cmd) await showCommandDoc(cmd, term, this, doneCallback);
            } else if (isPrintable(e) && e !== "q") {
                this._activateSearch(e);
            }
        },

        // ── Mouse Handler ─────────────────────────────────────────────

        _handleMouse({ btn, x, absY, isPress }) {
            const renderer = this._searchState.mode ? this._searchRenderer : this._renderer;
            const action = renderer.getActionAt(absY, x);

            if (btn === 35) { // hover
                if (this._searchState.mode) {
                    handleSearchMouseHover(action, this._searchRenderer, this._searchState);
                } else if (action !== this._renderer.hoveredAction) {
                    this._renderer.draw(this._renderer.currentSection, action);
                }
                return null;
            }
            if (btn === 64) { this._renderer.scroll("up");   return null; }
            if (btn === 65) { this._renderer.scroll("down"); return null; }
            if (btn === 0 && isPress && action) return action;
            return null;
        },

        // ── Navigation ────────────────────────────────────────────────

        _carouselNav(sectionIdx) {
            this._hoveredIdx = -1;
            this._renderer.draw(sectionIdx);
        },

        _listNav(newIdx) {
            this._hoveredIdx = newIdx;
            this._renderer.draw(this._renderer.currentSection, idxToKey(newIdx));
        },

        // ── Search ────────────────────────────────────────────────────

        _activateSearch(seed = "") {
            this._searchState.mode  = true;
            this._searchState.query = seed;
            this._searchRenderer.update(seed);
        },
    };
}
