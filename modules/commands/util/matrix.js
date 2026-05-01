/**
 * @module modules/commands/util/matrix.js
 * @description Trigger the matrix rain visual effect.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - startMatrixRain from '../../terminal/effects/matrix-rain.js'
 *     - getCurrentTheme from '../../terminal/theme-engine.js'
 *     - THEMES from '../../data/themes.js'
 * - Exports: cmdMatrix
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { startMatrixRain } from "../../terminal/effects/matrix-rain.js";
import { getCurrentTheme } from "../../terminal/theme-engine.js";
import { THEMES } from "../../data/themes.js";

// ===================================================================
//  matrix — Activate code rain visual effect
// ===================================================================

export function cmdMatrix() {
    // Use the current theme's accent color for the rain
    const themeId = getCurrentTheme();
    const accent = THEMES[themeId]?.accent || "#00ff00";

    startMatrixRain(accent);

    return `${ANSI.green}▸${ANSI.reset} ${ANSI.dim}Entering the Matrix...${ANSI.reset}`;
}
