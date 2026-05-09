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
    }

    draw(sectionIndex, hoveredAction = null) {
        this.currentSection = sectionIndex;
        this.hoveredAction = hoveredAction;
        this.rowMap = {};

        let currentY = 1;
        const cols = getTermCols() || 80;
        let buffer = "\x1b[2J\x1b[3J\x1b[H";

        const writeLine = (str, action = null) => {
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
                const padLen = Math.max(0, cols - 1 - stripped.length);
                const paddedStr = str + " ".repeat(padLen);
                const hoveredStr = paddedStr.replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m");
                buffer += `\x1b[7m${hoveredStr}\x1b[27m\r\n`;
            } else {
                buffer += `${str}\r\n`;
            }
            currentY += lines;
        };

        const writeBlank = () => writeLine("");

        if (this.currentSection === -1) {
            this._drawRoot(writeLine, writeBlank, cols);
        } else {
            this._drawSection(writeLine, writeBlank, cols);
        }

        this.term.write(buffer);
    }

    _drawRoot(writeLine, writeBlank, cols) {
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
        
        if (this.hoveredAction && this.hoveredAction !== "q" && this.hoveredAction !== "bq") {
            const hovIdx = parseInt(this.hoveredAction) - 1;
            if (hovIdx >= 0 && hovIdx < HELP_CATEGORIES.length) {
                const cat = HELP_CATEGORIES[hovIdx];
                const section = HELP_SECTIONS.find(s => s.title === cat.section);
                // We don't have a direct description for help categories, but we can list some top commands
                const topCmds = section ? section.cmds.slice(0, 4).map(c => c[0]).join(", ") : "";
                writeLine(`  ${ANSI.cyan}ℹ ${cat.label}:${ANSI.reset} ${ANSI.dim}Contains: ${topCmds}...${ANSI.reset}`);
            } else {
                writeBlank();
            }
        } else {
            writeBlank();
        }
        
        writeBlank();
        writeLine(`  ${ANSI.dim}Press 1-${HELP_CATEGORIES.length} or click. ${ANSI.red}[Q]uit${ANSI.reset}`, "q");
        writeLine(`  ${ANSI.dim}Tip: Add ${ANSI.white}?${ANSI.dim} to any command for examples (e.g. ${ANSI.white}mx?${ANSI.dim})${ANSI.reset}`);
    }

    _drawSection(writeLine, writeBlank, cols) {
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
                writeLine(`       ${ANSI.dim}${desc}${ANSI.reset}`, val);
            } else {
                const pad = Math.max(1, 16 - name.length);
                writeLine(`   ${num} ${ANSI.cyan}${name}${ANSI.reset}${" ".repeat(pad)}${ANSI.dim}${desc}${ANSI.reset}`, val);
            }
        }

        writeBlank();
        
        if (this.hoveredAction && this.hoveredAction !== "b" && this.hoveredAction !== "q" && this.hoveredAction !== "bq") {
            const hovIdx = (this.hoveredAction >= '1' && this.hoveredAction <= '9') 
                ? parseInt(this.hoveredAction) - 1 
                : this.hoveredAction.charCodeAt(0) - 97 + 9;
            
            if (hovIdx >= 0 && hovIdx < section.cmds.length) {
                const [hName, hDesc, hAliases] = section.cmds[hovIdx];
                const aliasText = hAliases ? ` (aliases: ${hAliases})` : "";
                writeLine(`  ${ANSI.cyan}ℹ ${hName}${aliasText}:${ANSI.reset} ${ANSI.dim}${hDesc}${ANSI.reset}`);
            } else {
                writeBlank();
            }
        } else {
            writeBlank();
        }

        writeBlank();
        const lastVal = section.cmds.length <= 9 ? section.cmds.length.toString() : String.fromCharCode(97 + section.cmds.length - 1 - 9);
        const range = section.cmds.length <= 9 ? `1-${lastVal}` : `1-9, a-${lastVal}`;
        writeLine(`  ${ANSI.dim}Press ${range} or click to run. ${ANSI.yellow}[B]ack${ANSI.reset}  ${ANSI.red}[Q]uit${ANSI.reset}`, "bq");
    }

    getActionAt(y, x) {
        const action = this.rowMap[y];
        if (!action) return null;
        if (action === "bq") {
            return x < 50 ? "b" : "q";
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
