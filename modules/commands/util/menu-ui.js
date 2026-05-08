/**
 * @module modules/commands/util/menu-ui.js
 * @description Pure rendering and state tracking for the interactive Platform Navigator.
 */

import { ANSI, stripAnsi } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { CATEGORIES } from "../../data/menu-data.js";

/**
 * Encapsulates the drawing logic and click-coordinate mapping for the menu.
 */
export class MenuRenderer {
    constructor(term) {
        this.term = term;
        this.rowMap = {};
        this.currentCategory = -1;
        this.hoveredAction = null;
    }

    draw(categoryId, hoveredAction = null) {
        this.currentCategory = categoryId;
        this.hoveredAction = hoveredAction;
        this.rowMap = {};
        
        let currentY = 1;
        const cols = getTermCols() || 80;
        
        // We buffer the output to avoid flickering during hover redraws
        let buffer = "\x1b[2J\x1b[3J\x1b[H";

        const writeLine = (str, action = null) => {
            const stripped = stripAnsi(str);
            const len = stripped.length;
            
            // Xterm auto-wraps. If length exactly matches cols, \n creates an extra blank line.
            // A safer approach for UI menus is to pad or truncate to avoid native wrapping issues,
            // or precisely calculate it. Here we just use Math.ceil.
            let lines = Math.ceil(len / cols);
            if (lines === 0) lines = 1; // Empty lines take 1 row
            
            if (action) {
                for (let i = 0; i < lines; i++) {
                    this.rowMap[currentY + i] = action;
                }
            }

            // Apply hover visual feedback
            if (action && action === this.hoveredAction) {
                // Invert colors for the hovered line
                buffer += `\x1b[7m${str}\x1b[27m\r\n`;
            } else {
                buffer += `${str}\r\n`;
            }
            
            currentY += lines;
        };

        const writeBlank = () => writeLine("");

        if (this.currentCategory === -1) {
            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// PLATFORM NAVIGATOR ///${ANSI.reset}  ${ANSI.dim}Main Menu${ANSI.reset}`);
            writeBlank();
            writeLine(`  Welcome to WhatHappened. Select a category to explore commands:`);
            writeBlank();

            for (let i = 0; i < CATEGORIES.length; i++) {
                const val = (i + 1).toString();
                const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${CATEGORIES[i].name}${ANSI.reset}`;
                writeLine(title, val);
                writeLine(`        ${ANSI.dim}${CATEGORIES[i].desc}${ANSI.reset}`);
            }

            writeBlank();
            writeLine(`  ${ANSI.dim}Press 1-${CATEGORIES.length} or click an option. ${ANSI.red}[Q]uit${ANSI.reset}`, "q");
            writeLine(`  ${ANSI.dim}Tip: Press Ctrl+Shift+. anytime to toggle this panel.${ANSI.reset}`);
        } else {
            const cat = CATEGORIES[this.currentCategory];
            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// ${cat.name.toUpperCase()} ///${ANSI.reset}`);
            writeBlank();
            
            for (let i = 0; i < cat.commands.length; i++) {
                const val = (i + 1).toString();
                const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${cat.commands[i].cmd.padEnd(10)}${ANSI.reset} ${ANSI.dim}- ${cat.commands[i].desc}${ANSI.reset}`;
                writeLine(title, val);
            }

            writeBlank();
            writeLine(`  ${ANSI.dim}Press 1-${cat.commands.length} or click to run. ${ANSI.yellow}[B]ack${ANSI.reset}  ${ANSI.red}[Q]uit${ANSI.reset}`, "bq");
        }

        this.term.write(buffer);
    }

    getActionAt(y, x) {
        const action = this.rowMap[y];
        if (!action) return null;
        
        // Handle split buttons on the same line
        if (action === "bq") {
            if (x < 50) return "b";
            return "q";
        }
        return action;
    }
}
