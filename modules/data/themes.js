/**
 * @module modules/data/themes.js
 * @description Visual theme definitions for the terminal.
 * 
 * Each theme provides:
 *  - CSS custom properties (applied to :root at runtime)
 *  - xterm.js ANSI color palette
 *  - Display metadata
 * 
 * @connections
 * - Imports: Theme modules from './themes/' directory
 * - Exports: THEMES, DEFAULT_THEME_ID
 * - Layer: Data Layer - Static constants, dictionaries, and autocomplete datasets.
 */

import { themeWHDark } from "./themes/theme-wh-dark.js";
import { themeAmber } from "./themes/theme-amber.js";
import { themeClassic } from "./themes/theme-classic.js";
import { themeWHUI } from "./themes/theme-wh-ui.js";

export const DEFAULT_THEME_ID = "wh_ui";

export const THEMES = {
    wh_ui: themeWHUI,
    wh_dark: themeWHDark,
    amber: themeAmber,
    classic: themeClassic,
};
