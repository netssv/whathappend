/**
 * @module modules/commands/util/search-controller.js
 * @description Centralized input routing for Search mode across TUI modules.
 *              Used by menu.js and help.js to share identical search UX logic.
 */

import { isUp, isDown, isEnter, isEsc, isBack, isPrintable, charToIndex, listUp, listDown } from "./menu-input.js";

/**
 * Handles keyboard input while in Search mode.
 */
export async function handleSearchInput(e, lower, term, doneCallback, context) {
    const { state, searchRenderer, mainRenderer, onExecute } = context;

    if (isEsc(e) || (isBack(e) && state.query.length === 0)) {
        state.mode = false;
        mainRenderer.draw(mainRenderer.currentCategory ?? mainRenderer.currentSection);
        return;
    }
    if (isBack(e)) {
        state.query = state.query.slice(0, -1);
        searchRenderer.update(state.query, searchRenderer.hoveredAction);
        return;
    }
    if (isUp(e)) {
        let idx = searchRenderer.hoveredAction ? parseInt(searchRenderer.hoveredAction) - 1 : 0;
        idx = listUp(idx, searchRenderer.results.length);
        searchRenderer.update(state.query, (idx + 1).toString());
        return;
    }
    if (isDown(e)) {
        let idx = searchRenderer.hoveredAction ? parseInt(searchRenderer.hoveredAction) - 1 : -1;
        idx = listDown(idx, searchRenderer.results.length);
        searchRenderer.update(state.query, (idx + 1).toString());
        return;
    }
    if (isEnter(e)) {
        const action = searchRenderer.hoveredAction || "1";
        const cmd = searchRenderer.getResultCmd(action);
        if (cmd) { state.mode = false; await onExecute(cmd, term, doneCallback); }
        return;
    }

    const actionIdx = charToIndex(lower);
    if ((e >= "1" && e <= "9") || (actionIdx !== -1 && !isPrintable(e))) {
        const cmd = searchRenderer.getResultCmd(lower);
        if (cmd) { state.mode = false; await onExecute(cmd, term, doneCallback); }
        return;
    }
    if (isPrintable(e)) {
        state.query += e;
        searchRenderer.update(state.query, null);
    }
}

/**
 * Handles mouse hover while in Search mode.
 */
export function handleSearchMouseHover(action, searchRenderer, state) {
    if (action && action !== searchRenderer.hoveredAction) {
        searchRenderer.update(state.query, action);
    }
}
