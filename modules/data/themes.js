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

import { themeWhOS } from "./themes/theme-whos.js";
import { themeAmber } from "./themes/theme-amber.js";
import { themeMatrix } from "./themes/theme-matrix.js";
import { themeModern } from "./themes/theme-modern.js";

export const DEFAULT_THEME_ID = "modern";

export const THEMES = {
    WhOS: themeWhOS,
    amber: themeAmber,
    matrix: themeMatrix,
    modern: themeModern,
};
