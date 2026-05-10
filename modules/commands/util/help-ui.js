/**
 * @module modules/commands/util/help-ui.js
 * @description Pure rendering class for the interactive Help TUI.
 *              Mirrors MenuRenderer pattern — stateless draw + rowMap for clicks/hover.
 *
 * @connections
 * - Imports: ANSI, stripAnsi from '../../formatter.js', getTermCols from '../../state.js'
 * - Exports: HelpRenderer, HELP_CATEGORIES
 * - Layer: Command Layer (Util) — stateless view helper.
 */

import { ANSI, stripAnsi } from "../../formatter.js";
import { getTermCols } from "../../state.js";
import { HELP_SECTIONS } from "../../data/help-data.js";

// ── Category map for drill-down ──────────────────────────────────────

export const HELP_CATEGORIES = [
    { key: "audit",  label: "🛡️ Audit Tools",   section: "AUDIT TOOLS" },
    { key: "dns",    label: "📡 DNS",             section: "DNS" },
    { key: "email",  label: "📧 Email",           section: "EMAIL" },
    { key: "web",    label: "🌐 Web Tools",       section: "WEB TOOLS" },
    { key: "net",    label: "⚡ Network",          section: "NETWORK" },
    { key: "ext",    label: "🔗 External",         section: "EXTERNAL" },
    { key: "util",   label: "💻 Utilities",        section: "UTIL" },
];

// ── Renderer ─────────────────────────────────────────────────────────

export class HelpRenderer {
    constructor(term) {
        this.term = term;
        this.rowMap = {};
        this.currentSection = -1; // -1 = root
        this.hoveredAction = null;
        this.scrollTop = 0;
    }

    scroll(direction) {
        if (direction === "up") this.scrollTop = Math.max(0, this.scrollTop - 3);
        else if (direction === "down") this.scrollTop += 3;
        this.draw(this.currentSection, this.hoveredAction);
    }

    draw(sectionIndex, hoveredAction = null) {
        if (sectionIndex !== this.currentSection) this.scrollTop = 0;
        this.currentSection = sectionIndex;
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

        if (this.currentSection === -1) {
            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// COMMAND REFERENCE ///${ANSI.reset}  ${ANSI.dim}Help Menu${ANSI.reset}`);
            writeBlank();
            writeLine(`  Select a category to explore commands:`);
            writeBlank();

            for (let i = 0; i < HELP_CATEGORIES.length; i++) {
                const val = (i + 1).toString();
                const title = `    ${ANSI.bold}[${val}]${ANSI.reset} ${ANSI.white}${HELP_CATEGORIES[i].label}${ANSI.reset}`;
                writeLine(title, val);
            }

            writeBlank();
            
            if (this.hoveredAction && this.hoveredAction !== "quit" && this.hoveredAction !== "BACK_QUIT") {
                const hovIdx = parseInt(this.hoveredAction) - 1;
                if (hovIdx >= 0 && hovIdx < HELP_CATEGORIES.length) {
                    const cat = HELP_CATEGORIES[hovIdx];
                    const section = HELP_SECTIONS.find(s => s.title === cat.section);
                    const topCmds = section ? section.cmds.slice(0, 4).map(c => c[0]).join(", ") : "";
                    writeWrapped(`  ${ANSI.cyan}ℹ ${cat.label}:${ANSI.reset} ${ANSI.dim}Contains: ${topCmds}...${ANSI.reset}`);
                } else {
                    writeBlank();
                }
            } else {
                writeBlank();
            }
            
            writeBlank();
            
            pushLine(footerLines, `  ${ANSI.dim}═══${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Tip: Add ${ANSI.white}?${ANSI.dim} to any command for examples (e.g. ${ANSI.white}mx?${ANSI.dim})${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Press 1-${HELP_CATEGORIES.length} or click.${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.red}[Q]uit${ANSI.reset}`, "quit");
            
        } else {
            const cat = HELP_CATEGORIES[this.currentSection];
            const section = HELP_SECTIONS.find(s => s.title === cat.section);
            if (!section) return;

            writeLine(`  ${ANSI.bold}${ANSI.cyan}/// ${section.title} ///${ANSI.reset}`);
            writeBlank();

            const narrow = cols < 55;

            for (let i = 0; i < section.cmds.length; i++) {
                const [name, desc] = section.cmds[i];
                const val = i < 9 ? (i + 1).toString() : String.fromCharCode(97 + i - 9);
                const num = `${ANSI.bold}[${val.padStart(2)}]${ANSI.reset}`;
                if (narrow) {
                    writeLine(`   ${num} ${ANSI.cyan}${name}${ANSI.reset}`, val);
                    writeWrapped(`       ${ANSI.dim}${desc}${ANSI.reset}`, val);
                } else {
                    const pad = Math.max(1, 16 - name.length);
                    writeWrapped(`   ${num} ${ANSI.cyan}${name}${ANSI.reset}${" ".repeat(pad)}${ANSI.dim}${desc}${ANSI.reset}`, val);
                }
            }

            writeBlank();
            
            if (this.hoveredAction && this.hoveredAction !== "back" && this.hoveredAction !== "quit" && this.hoveredAction !== "BACK_QUIT") {
                const hovIdx = (this.hoveredAction >= '1' && this.hoveredAction <= '9') 
                    ? parseInt(this.hoveredAction) - 1 
                    : this.hoveredAction.charCodeAt(0) - 97 + 9;
                
                if (hovIdx >= 0 && hovIdx < section.cmds.length) {
                    const [hName, hDesc, hAliases] = section.cmds[hovIdx];
                    const aliasText = hAliases ? ` (aliases: ${hAliases})` : "";
                    writeWrapped(`  ${ANSI.cyan}ℹ ${hName}${aliasText}:${ANSI.reset} ${ANSI.dim}${hDesc}${ANSI.reset}`);
                } else {
                    writeBlank();
                }
            } else {
                writeBlank();
            }

            writeBlank();
            
            const lastVal = section.cmds.length <= 9 ? section.cmds.length.toString() : String.fromCharCode(97 + section.cmds.length - 1 - 9);
            const range = section.cmds.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;
            
            pushLine(footerLines, `  ${ANSI.dim}════════════════════════════${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.dim}Press ${range} or click to run.${ANSI.reset}`);
            pushLine(footerLines, `  ${ANSI.yellow}[B]ack${ANSI.reset}      ${ANSI.red}[Q]uit${ANSI.reset}`, "BACK_QUIT");
        }

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
                        const match = str.match(/^(\s*)(.*)$/);
                        if (match) {
                            buffer += `${match[1]}\x1b[7m${match[2].replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                        } else {
                            buffer += `\x1b[7m${str.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m\r\n`;
                        }
                    } else {
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

    /** Returns the command string for a given index in the current section */
    getCommandAt(index) {
        if (this.currentSection < 0) return null;
        const cat = HELP_CATEGORIES[this.currentSection];
        const section = HELP_SECTIONS.find(s => s.title === cat.section);
        if (!section || index < 0 || index >= section.cmds.length) return null;
        return section.cmds[index][0]; // command name
    }

    getSectionCommandCount() {
        if (this.currentSection < 0) return 0;
        const cat = HELP_CATEGORIES[this.currentSection];
        const section = HELP_SECTIONS.find(s => s.title === cat.section);
        return section ? section.cmds.length : 0;
    }
}
