/**
 * @module modules/terminal/theme-engine.js
 * @description Runtime theme engine — applies, persists, and restores visual themes.
 * 
 * @connections
 * - Imports: 
 *     - THEMES, DEFAULT_THEME_ID from '../data/themes.js'
 * - Exports: initThemeEngine, applyTheme, getCurrentTheme, getThemeList
 * - Layer: Terminal Layer (UI) - Manages xterm.js rendering and visual output.
 */

import { THEMES, DEFAULT_THEME_ID } from "../data/themes.js";

const STORAGE_KEY = "wh_theme";
let _currentThemeId = DEFAULT_THEME_ID;
let _termRef = null;

/**
 * Initialize the theme engine: restore saved theme and apply it.
 * Must be called after term.open().
 * @param {Terminal} term - xterm.js Terminal instance
 */
export async function initThemeEngine(term) {
    _termRef = term;

    // Restore saved theme
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        if (data[STORAGE_KEY] && THEMES[data[STORAGE_KEY]]) {
            _currentThemeId = data[STORAGE_KEY];
        }
    } catch (_) {}

    applyThemeInternal(_currentThemeId, false);

    // Start logo bounce hint AFTER theme is fully painted (double-rAF prevents glitch)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const logo = document.getElementById("context-logo");
            if (logo) logo.classList.add("pulse-hint");
        });
    });
}

/**
 * Apply a theme by ID. Saves to storage and updates UI.
 * @param {string} id - Theme ID ("WhOS", "amber", "matrix")
 * @returns {boolean} true if applied, false if invalid ID
 */
export function applyTheme(id) {
    if (!THEMES[id]) return false;
    applyThemeInternal(id, true);
    return true;
}

/**
 * @returns {string} Current theme ID
 */
export function getCurrentTheme() {
    return _currentThemeId;
}

/**
 * @returns {Array<{id: string, name: string, accent: string}>} List of available themes
 */
export function getThemeList() {
    return Object.entries(THEMES).map(([id, t]) => ({
        id,
        name: t.name,
        accent: t.accent,
        active: id === _currentThemeId,
    }));
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function applyThemeInternal(id, persist) {
    const theme = THEMES[id];
    if (!theme) return;

    _currentThemeId = id;

    // 1. Apply CSS custom properties to :root
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(theme.css)) {
        root.style.setProperty(prop, value);
    }

    // 1b. Set data-theme attribute for CSS-scoped overrides
    root.setAttribute("data-theme", id);

    // 2. Apply xterm.js palette
    if (_termRef) {
        _termRef.options.theme = theme.xterm;
    }

    // 3. Update active indicator on menu buttons
    updateMenuIndicators(id);

    // 4. Persist to storage (both dedicated key and config store)
    if (persist) {
        try {
            chrome.storage.local.set({ [STORAGE_KEY]: id });
            // Sync into wh_config so `config list` reflects the theme
            chrome.storage.local.get("wh_config", (data) => {
                const config = data["wh_config"] || {};
                config.theme = id;
                chrome.storage.local.set({ wh_config: config });
            });
        } catch (_) {}
    }
}

function updateMenuIndicators(activeId) {
    for (const id of Object.keys(THEMES)) {
        const btn = document.getElementById(`menu-theme-${id}`);
        if (!btn) continue;
        
        const dot = btn.querySelector("span:first-child");
        if (id === activeId) {
            btn.classList.add("active-theme");
            if (dot) dot.style.color = THEMES[id].accent;
        } else {
            btn.classList.remove("active-theme");
            if (dot) dot.style.color = "";
        }
    }
}
