/**
 * @module modules/commands/util/menu-ui.js
 * @description Pure rendering and state tracking for the interactive Platform Navigator.
 */

import { ANSI, stripAnsi } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { wrapAnsiText, renderMenuBlock, getMenuActionAt, buildPageDots } from "../../utils.js";
import { CATEGORIES } from "../../data/menu-data.js";

/**
 * Encapsulates the drawing logic and click-coordinate mapping for the menu.
 */
export class MenuRenderer {
    constructor(term) {
        this.term = term;
        this.rowMap = {};
        this.currentCategory = 0;
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
        
        const writeWrapped = (str, action = null) => {
            const wrappedLines = wrapAnsiText(str, cols);
            for (const lineStr of wrappedLines) {
                pushLine(lines, lineStr, action);
            }
        };

        const writeBlank = () => pushLine(lines, "");

        const writeFooterWrapped = (str, action = null) => {
            const wrappedLines = wrapAnsiText(str, cols);
            for (const lineStr of wrappedLines) {
                pushLine(footerLines, lineStr, action);
            }
        };

        // --- Build Body ---
        if (categoryId === -1) this.currentCategory = 0;
        const cat = CATEGORIES[this.currentCategory];
        
        const safeTitle = cat.name.toUpperCase().replace(/[^\x20-\x7E]/g, "").trim(); 
        pushLine(lines, "", {
            type: "carousel",
            title: safeTitle,
            cols, // ← required for exact hitbox calculation
        });
        writeBlank();
        
        // Single Column Layout
        for (let i = 0; i < cat.commands.length; i++) {
            const val = i < 9 ? (i + 1).toString() : String.fromCharCode(97 + i - 9);
            const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${cat.commands[i].cmd}${ANSI.reset}`;
            writeWrapped(title, val);
        }
        writeBlank();
        
        // --- Build Footer ---
        writeFooterWrapped(`  ${ANSI.dim}── ${cat.desc}${ANSI.reset}`);
        
        if (this.hoveredAction && this.hoveredAction !== "quit" && this.hoveredAction !== "prev" && this.hoveredAction !== "next" && this.hoveredAction !== "search") {
            let hovIdx = -1;
            if (this.hoveredAction >= '1' && this.hoveredAction <= '9') {
                hovIdx = parseInt(this.hoveredAction) - 1;
            } else if (this.hoveredAction.length === 1) {
                hovIdx = this.hoveredAction.charCodeAt(0) - 97 + 9;
            }
            if (hovIdx >= 0 && hovIdx < cat.commands.length) {
                const hovCmd = cat.commands[hovIdx];
                const aliasText = hovCmd.aliases ? ` (aliases: ${hovCmd.aliases})` : "";
                writeFooterWrapped(`  ${ANSI.cyan}ℹ ${hovCmd.cmd}${aliasText}:${ANSI.reset} ${ANSI.white}${hovCmd.desc}${ANSI.reset}`);
            } else {
                writeFooterWrapped(` `);
            }
        } else {
            writeFooterWrapped(` `);
        }

        const lastVal = cat.commands.length <= 9 ? cat.commands.length.toString() : String.fromCharCode(97 + cat.commands.length - 1 - 9);
        const range = cat.commands.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;

        // Page dots divider
        const dots = buildPageDots(current, total, cols, ANSI);
        writeFooterWrapped(`${ANSI.dim}${dots}${ANSI.reset}`);
        writeFooterWrapped(`  ${ANSI.dim}[menu] runs commands · [help] shows docs   ${ANSI.white}[/]${ANSI.dim} to search${ANSI.reset}`);
        writeFooterWrapped(`  ${ANSI.dim}← → navigate · Press ${range} or click to run.${ANSI.reset}`);
        writeFooterWrapped(`  ${ANSI.red}[Q]uit${ANSI.reset}`, "quit");

        // --- Layout & Render ---
        let buffer = "\x1b[2J\x1b[3J\x1b[H";
        const availableRows = Math.max(5, rows - footerLines.length);
        
        this.scrollTop = Math.max(0, Math.min(this.scrollTop, lines.length - availableRows));
        
        let currentY = 1;
        const visibleLines = lines.slice(this.scrollTop, this.scrollTop + availableRows);
        
        const renderRes = renderMenuBlock(visibleLines, this.hoveredAction, cols, this.rowMap, currentY, ANSI);
        buffer += renderRes.buffer;
        currentY = renderRes.currentY;
        
        // Pad empty space to push footer to bottom
        while(currentY <= availableRows) {
            buffer += "\r\n";
            currentY++;
        }
        
        buffer += renderMenuBlock(footerLines, this.hoveredAction, cols, this.rowMap, currentY, ANSI).buffer;
        
        // Prevent terminal native scrolling by removing the very last trailing newline
        buffer = buffer.replace(/\r\n$/, "");

        this.term.write(buffer);
    }

    getActionAt(y, x) {
        return getMenuActionAt(y, x, this.rowMap);
    }
}
