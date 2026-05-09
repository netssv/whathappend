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
            
            // Extract leading spaces to preserve indentation on wrapped lines
            const leadingSpacesMatch = stripped.match(/^(\s*)/);
            const indentStr = leadingSpacesMatch ? leadingSpacesMatch[1] : "";
            const indentLen = indentStr.length;
            
            if (stripped.length <= cols) {
                if (action) this.rowMap[currentY] = action;
                if (action && action === this.hoveredAction) {
                    const padLen = Math.max(0, cols - 1 - stripped.length);
                    const paddedStr = str + " ".repeat(padLen);
                    const hoveredStr = paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
                    buffer += `\x1b[7m${hoveredStr}\x1b[27m\r\n`;
                } else {
                    buffer += `${str}\r\n`;
                }
                currentY += 1;
                return;
            }

            let remainingRaw = str;
            let firstLine = true;
            
            while (remainingRaw.length > 0) {
                const availCols = firstLine ? cols : Math.max(10, cols - indentLen);
                const rawStripped = stripAnsi(remainingRaw);
                
                if (rawStripped.length <= cols) {
                    if (action) this.rowMap[currentY] = action;
                    let out = firstLine ? remainingRaw : `${indentStr}${remainingRaw}`;
                    if (action && action === this.hoveredAction) {
                        const outStripped = stripAnsi(out);
                        const padLen = Math.max(0, cols - 1 - outStripped.length);
                        const paddedStr = out + " ".repeat(padLen);
                        const hoveredStr = paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
                        buffer += `\x1b[7m${hoveredStr}\x1b[27m\r\n`;
                    } else {
                        buffer += `${out}\r\n`;
                    }
                    currentY += 1;
                    break;
                }
                
                let breakIdx = rawStripped.lastIndexOf(" ", cols);
                if (breakIdx <= indentLen) breakIdx = cols; 
                
                let truncated = rawStripped.substring(0, cols - 3) + "...";
                const colorMatch = str.match(/^(\s*\x1b\[[0-9;]*m)/);
                if (colorMatch) truncated = colorMatch[1] + truncated.trimStart() + ANSI.reset;

                if (action) this.rowMap[currentY] = action;
                if (action && action === this.hoveredAction) {
                    const truncStripped = stripAnsi(truncated);
                    const padLen = Math.max(0, cols - 1 - truncStripped.length);
                    const paddedStr = truncated + " ".repeat(padLen);
                    const hoveredStr = paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
                    buffer += `\x1b[7m${hoveredStr}\x1b[27m\r\n`;
                } else {
                    buffer += `${truncated}\r\n`;
                }
                currentY += 1;
                break;
            }
        };

        const writeWrapped = (str, action = null) => {
            const stripped = stripAnsi(str);
            const len = stripped.length;
            let lines = Math.ceil(len / cols);
            if (lines === 0) lines = 1;

            if (action) {
                for (let i = 0; i < lines; i++) {
                    this.rowMap[currentY + i] = action;
                }
            }

            if (action && action === this.hoveredAction) {
                const padLen = Math.max(0, cols - 1 - len);
                const paddedStr = str + " ".repeat(padLen);
                const hoveredStr = paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
                buffer += `\x1b[7m${hoveredStr}\x1b[27m\r\n`;
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
                writeLine(`        ${ANSI.dim}${CATEGORIES[i].desc}${ANSI.reset}`, val);
            }

            writeBlank();
            
            if (this.hoveredAction && this.hoveredAction !== "q" && this.hoveredAction !== "bq") {
                const hovIdx = parseInt(this.hoveredAction) - 1;
                if (hovIdx >= 0 && hovIdx < CATEGORIES.length) {
                    const cat = CATEGORIES[hovIdx];
                    writeWrapped(`  ${ANSI.cyan}ℹ ${cat.name}:${ANSI.reset} ${ANSI.dim}${cat.desc}${ANSI.reset}`);
                } else {
                    writeBlank();
                }
            } else {
                writeBlank();
            }
            
            writeBlank();
            writeLine(`  ${ANSI.dim}Press 1-${CATEGORIES.length} or click an option. ${ANSI.red}[Q]uit${ANSI.reset}`, "q");
            writeLine(`  ${ANSI.dim}Tip: Press Ctrl+Shift+. anytime to toggle this panel.${ANSI.reset}`);
        } else {
            const cat = CATEGORIES[this.currentCategory];
            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// ${cat.name.toUpperCase()} ///${ANSI.reset}`);
            writeBlank();
            
            for (let i = 0; i < cat.commands.length; i++) {
                const val = i < 9 ? (i + 1).toString() : String.fromCharCode(97 + i - 9);
                const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${cat.commands[i].cmd.padEnd(14)}${ANSI.reset} ${ANSI.dim}- ${cat.commands[i].desc}${ANSI.reset}`;
                writeLine(title, val);
            }

            writeBlank();
            
            // Submenu explanation
            writeWrapped(`  ${ANSI.dim}── ${cat.desc}${ANSI.reset}`);
            
            // Extended command info on hover
            if (this.hoveredAction && this.hoveredAction !== "b" && this.hoveredAction !== "q" && this.hoveredAction !== "bq") {
                const hovIdx = (this.hoveredAction >= '1' && this.hoveredAction <= '9') 
                    ? parseInt(this.hoveredAction) - 1 
                    : this.hoveredAction.charCodeAt(0) - 97 + 9;
                
                if (hovIdx >= 0 && hovIdx < cat.commands.length) {
                    const hovCmd = cat.commands[hovIdx];
                    const aliasText = hovCmd.aliases ? ` (aliases: ${hovCmd.aliases})` : "";
                    writeWrapped(`  ${ANSI.cyan}ℹ ${hovCmd.cmd}${aliasText}:${ANSI.reset} ${ANSI.dim}${hovCmd.desc}${ANSI.reset}`);
                } else {
                    writeBlank();
                }
            } else {
                writeBlank();
            }

            writeBlank();
            const lastVal = cat.commands.length <= 9 ? cat.commands.length.toString() : String.fromCharCode(97 + cat.commands.length - 1 - 9);
            const range = cat.commands.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;
            writeLine(`  ${ANSI.dim}Press ${range} or click to run. ${ANSI.yellow}[B]ack${ANSI.reset}  ${ANSI.red}[Q]uit${ANSI.reset}`, "bq");
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
