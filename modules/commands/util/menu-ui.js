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
        this.scrollTop = 0;
    }

    scroll(direction) {
        if (direction === "up") this.scrollTop = Math.max(0, this.scrollTop - 3);
        else if (direction === "down") this.scrollTop += 3;
        this.draw(this.currentCategory, this.hoveredAction);
    }

    draw(categoryId, hoveredAction = null) {
        if (categoryId !== this.currentCategory) this.scrollTop = 0; // Reset scroll on view change
        this.currentCategory = categoryId;
        this.hoveredAction = hoveredAction;
        this.rowMap = {};
        
        const cols = this.term.cols || getTermCols() || 80;
        const rows = this.term.rows || 24;
        
        const lines = [];
        const footerLines = [];

        const pushLine = (arr, str, action = null) => arr.push({ str, action });
        
        const writeLine = (str, action = null) => {
            const stripped = stripAnsi(str);
            if (stripped.length <= cols) return pushLine(lines, str, action);
            
            // Extract leading spaces to preserve indentation on wrapped lines
            const leadingSpacesMatch = stripped.match(/^(\s*)/);
            const indentLen = leadingSpacesMatch ? leadingSpacesMatch[1].length : 0;
            
            let breakIdx = stripped.lastIndexOf(" ", cols);
            if (breakIdx <= indentLen) breakIdx = cols; 
            
            let truncated = stripped.substring(0, cols - 3) + "...";
            const colorMatch = str.match(/^(\s*\x1b\[[0-9;]*m)/);
            if (colorMatch) truncated = colorMatch[1] + truncated.trimStart() + ANSI.reset;
            
            pushLine(lines, truncated, action);
        };

        const writeWrapped = (str, action = null) => {
            const stripped = stripAnsi(str);
            if (stripped.length <= cols) return pushLine(lines, str, action);
            
            const leadingMatch = stripped.match(/^(\s*)/);
            const indentStr = leadingMatch ? leadingMatch[1] : "";
            const indentLen = indentStr.length;
            
            let currentLine = "";
            let currentLen = 0;
            let activeAnsi = "";
            
            const tokens = str.split(/(\s+|\x1b\[[0-9;]*m)/g).filter(Boolean);
            
            for (const token of tokens) {
                if (token.startsWith('\x1b')) {
                    if (token === '\x1b[0m') activeAnsi = "";
                    else activeAnsi += token;
                    currentLine += token;
                } else if (token.match(/^\s+$/)) {
                    if (currentLen === 0) {
                        currentLine += token; currentLen += token.length;
                    } else if (currentLen + token.length <= cols) {
                        currentLine += token; currentLen += token.length;
                    }
                } else {
                    if (currentLen + token.length > cols && currentLen > indentLen) {
                        pushLine(lines, currentLine + (activeAnsi ? '\x1b[0m' : ''), action);
                        currentLine = indentStr + activeAnsi + token;
                        currentLen = indentLen + token.length;
                    } else {
                        currentLine += token;
                        currentLen += token.length;
                    }
                }
            }
            if (currentLen > 0) pushLine(lines, currentLine + (activeAnsi ? '\x1b[0m' : ''), action);
        };

        const writeBlank = () => pushLine(lines, "");

        // --- Build Body ---
        if (this.currentCategory === -1) {
            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// PLATFORM NAVIGATOR ///${ANSI.reset}  ${ANSI.dim}Main Menu${ANSI.reset}`);
            writeBlank();
            writeLine(`  Select a category to explore commands:`);
            writeBlank();

            for (let i = 0; i < CATEGORIES.length; i++) {
                const val = (i + 1).toString();
                const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${CATEGORIES[i].name}${ANSI.reset}`;
                writeLine(title, val);
                writeWrapped(`        ${ANSI.dim}${CATEGORIES[i].desc}${ANSI.reset}`, val);
            }

            writeBlank();
            
            if (this.hoveredAction && this.hoveredAction !== "quit" && this.hoveredAction !== "BACK_QUIT") {
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
            
            // Build Footer
            pushLine(footerLines, `  ${ANSI.dim}═══${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Tip: Press Ctrl+Shift+. anytime to toggle panel.${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Press 1-${CATEGORIES.length} or click.${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.red}[Q]uit${ANSI.reset}`, "quit");
            
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
            writeWrapped(`  ${ANSI.dim}── ${cat.desc}${ANSI.reset}`);
            
            if (this.hoveredAction && this.hoveredAction !== "back" && this.hoveredAction !== "quit" && this.hoveredAction !== "BACK_QUIT") {
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
            
            // Build Footer
            const lastVal = cat.commands.length <= 9 ? cat.commands.length.toString() : String.fromCharCode(97 + cat.commands.length - 1 - 9);
            const range = cat.commands.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;
            
            pushLine(footerLines, `  ${ANSI.dim}════════════════════════════${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Press ${range} or click to run.${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.yellow}[B]ack${ANSI.reset}      ${ANSI.red}[Q]uit${ANSI.reset}`, "BACK_QUIT");
        }

        // --- Layout & Render ---
        let buffer = "\x1b[2J\x1b[3J\x1b[H";
        const availableRows = Math.max(5, rows - footerLines.length);
        
        this.scrollTop = Math.max(0, Math.min(this.scrollTop, lines.length - availableRows));
        
        let currentY = 1;
        const visibleLines = lines.slice(this.scrollTop, this.scrollTop + availableRows);
        
        const renderBlock = (blockLines) => {
            for (const {str, action} of blockLines) {
                if (action) this.rowMap[currentY] = action;
                
                if (action === "BACK_QUIT" && (this.hoveredAction === "back" || this.hoveredAction === "quit")) {
                    const backStr = `${ANSI.yellow}[B]ack${ANSI.reset}`;
                    const quitStr = `${ANSI.red}[Q]uit${ANSI.reset}`;
                    
                    if (this.hoveredAction === "back") {
                        buffer += `  \x1b[7m${backStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m      ${quitStr}\r\n`;
                    } else {
                        buffer += `  ${backStr}      \x1b[7m${quitStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                    }
                } else if (action && action === this.hoveredAction) {
                    const stripped = stripAnsi(str);
                    
                    if (action === "quit") {
                        // Invert the quit button string tightly without padding
                        const match = str.match(/^(\s*)(.*)$/);
                        if (match) {
                            buffer += `${match[1]}\x1b[7m${match[2].replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                        } else {
                            buffer += `\x1b[7m${str.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                        }
                    } else {
                        // Standard invert highlight for full width menu items
                        const padLen = Math.max(0, cols - 1 - stripped.length);
                        const paddedStr = str + " ".repeat(padLen);
                        buffer += `\x1b[7m${paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                    }
                } else {
                    buffer += `${str}\r\n`;
                }
                currentY++;
            }
        };

        renderBlock(visibleLines);
        
        // Pad empty space to push footer to bottom
        while(currentY <= availableRows) {
            buffer += "\r\n";
            currentY++;
        }
        
        renderBlock(footerLines);

        this.term.write(buffer);
    }

    getActionAt(y, x) {
        const action = this.rowMap[y];
        if (!action) return null;
        
        // Exact 1-indexed hitboxes
        if (action === "BACK_QUIT") {
            if (x >= 2 && x <= 10) return "back";
            if (x >= 13 && x <= 22) return "quit";
            return null;
        }
        
        if (action === "quit") {
            return (x >= 2 && x <= 10) ? "quit" : null;
        }
        return action;
    }
}
