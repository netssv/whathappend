/**
 * @module modules/commands/util/help.js
 * @description Interactive Help TUI (carousel + compact) + flag-based text output.
 *              Mirrors menu.js architecture: shared input helpers, runner, search.
 *
 * @connections
 * - Imports: HelpRenderer, HELP_CATEGORIES from './help-ui.js'
 * - Imports: SearchRenderer from './search-ui.js'
 * - Imports: menu-input.js helpers (parseSgrMouse, isQuit, isLeft, isRight, isUp,
 *            isDown, isEnter, isSearch, isEsc, isBack, isPrintable,
 *            charToIndex, idxToKey, carouselPrev, carouselNext, listUp, listDown)
 * - Imports: quit, enableHoverMouse, disposeInput from './menu-runner.js'
 * - Imports: renderTextHelp from './help-text.js'
 * - Exports: cmdHelp
 * - Layer: Command Layer (Util) — entry point + watcher orchestrator.
 */

import { ANSI } from "../../formatter.js";
import { HelpRenderer, HELP_CATEGORIES } from "./help-ui.js";
import { SearchRenderer } from "./search-ui.js";
import { renderTextHelp } from "./help-text.js";
import {
    parseSgrMouse, isQuit, isLeft, isRight, isUp, isDown,
    isEnter, isSearch, isEsc, isBack, isPrintable,
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

    return query ? renderTextHelp(query) : createHelpWatcher();
}

// ── Watcher Factory ───────────────────────────────────────────────────

function createHelpWatcher() {
    return { __watch: true, watcher: createWatcher() };
}

function createWatcher() {
    return {
        // State
        onDataDisposable: null,
        _renderer: null,
        _searchRenderer: null,
        _searchMode: false,
        _searchQuery: "",
        _hoveredIdx: -1,
        _mouseEnabled: false,
        clearOnExit: true,

        // ── Lifecycle ─────────────────────────────────────────────────

        start(term, doneCallback) {
            this._renderer       = new HelpRenderer(term);
            this._searchRenderer = new SearchRenderer(term);
            this._searchMode     = false;
            this._searchQuery    = "";
            this._hoveredIdx     = -1;
            this._renderer.draw(0);

            enableHoverMouse(term);
            this._mouseEnabled = true;
            this.onDataDisposable = term.onData((e) => this._onData(e, term, doneCallback));
        },

        _dispose() { disposeInput(this); },

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
                const handled = this._handleMouse(mouse, term);
                if (handled === null) return;
                lower = handled;
            }

            // 2. Global quit
            if (isQuit(e, lower)) { quit(term, this, doneCallback); return; }

            // 3. Search mode
            if (this._searchMode) { await this._handleSearch(e, lower, term, doneCallback); return; }

            // 4. Carousel ← → (cyclic)
            if (isLeft(e, lower))  { this._carouselNav(carouselPrev(this._renderer.currentSection, HELP_CATEGORIES.length), term); return; }
            if (isRight(e, lower)) { this._carouselNav(carouselNext(this._renderer.currentSection, HELP_CATEGORIES.length), term); return; }

            // 5. List ↑ ↓ with wrap-around
            if (isUp(e))   { const n = this._sectionCmdCount(); this._listNav(listUp(this._hoveredIdx, n), term); return; }
            if (isDown(e)) { const n = this._sectionCmdCount(); this._listNav(listDown(this._hoveredIdx, n), term); return; }

            // 6. Enter: view hovered command doc
            if (isEnter(e) && this._hoveredIdx >= 0) {
                const cmd = this._cmdAt(this._hoveredIdx);
                if (cmd) await showCommandDoc(cmd, term, this, doneCallback);
                return;
            }

            // 7. [/] or [?] → activate search
            if (isSearch(e)) { this._activateSearch(term); return; }

            // 8. Number key direct selection (1-9) or click → show doc immediately
            //    Any other printable char → activate search with that char as seed
            const actionIdx = charToIndex(lower);
            if ((e >= "1" && e <= "9") || (actionIdx !== -1 && !isPrintable(e))) {
                const cmd = this._cmdAt(actionIdx);
                if (cmd) await showCommandDoc(cmd, term, this, doneCallback);
            } else if (isPrintable(e) && e !== "q") {
                // Start search pre-seeded with this character
                this._searchMode  = true;
                this._searchQuery = e;
                this._searchRenderer.update(e);
            }
        },

        // ── Mouse Handler ─────────────────────────────────────────────

        _handleMouse({ btn, x, absY, isPress }, term) {
            const renderer = this._searchMode ? this._searchRenderer : this._renderer;
            const action = renderer.getActionAt(absY, x);

            if (btn === 35) { // hover
                if (!this._searchMode && action !== this._renderer.hoveredAction) {
                    this._renderer.draw(this._renderer.currentSection, action);
                }
                return null;
            }
            if (btn === 64) { this._renderer.scroll("up");   return null; }
            if (btn === 65) { this._renderer.scroll("down"); return null; }
            if (btn === 0 && isPress && action) return action;
            return null;
        },

        // ── Carousel ─────────────────────────────────────────────────

        _carouselNav(sectionIdx, term) {
            this._hoveredIdx = -1;
            this._renderer.draw(sectionIdx);
        },

        // ── List Navigation ───────────────────────────────────────────

        _listNav(newIdx, term) {
            this._hoveredIdx = newIdx;
            this._renderer.draw(this._renderer.currentSection, idxToKey(newIdx));
        },

        // ── Helpers ───────────────────────────────────────────────────

        _sectionCmdCount() {
            return this._renderer.getSectionCommandCount();
        },

        _cmdAt(idx) {
            return this._renderer.getCommandAt(idx);
        },

        // ── Search ────────────────────────────────────────────────────

        _activateSearch(term) {
            this._searchMode  = true;
            this._searchQuery = "";
            this._searchRenderer.update("");
        },

        async _handleSearch(e, lower, term, doneCallback) {
            if (isEsc(e) || (isBack(e) && this._searchQuery.length === 0)) {
                this._searchMode = false;
                this._renderer.draw(this._renderer.currentSection);
                return;
            }
            if (isBack(e)) {
                this._searchQuery = this._searchQuery.slice(0, -1);
                this._searchRenderer.update(this._searchQuery);
                return;
            }
            const actionIdx = charToIndex(lower);
            if ((e >= "1" && e <= "9") || (actionIdx !== -1 && !isPrintable(e))) {
                const cmd = this._searchRenderer.getResultCmd(lower);
                if (cmd) { this._searchMode = false; await showCommandDoc(cmd, term, this, doneCallback); }
                return;
            }
            if (isPrintable(e)) {
                this._searchQuery += e;
                this._searchRenderer.update(this._searchQuery);
            }
        },
    };
}
