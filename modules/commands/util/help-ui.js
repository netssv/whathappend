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
    { key: "audit",  label: "🛡️  Audit Tools",   section: "AUDIT TOOLS" },
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
                buffer += `\x1b[7m${str}\x1b[27m\r\n`;
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
            const val = (i + 1).toString();
            const num = `${ANSI.bold}[${val.padStart(2)}]${ANSI.reset}`;
            if (narrow) {
                writeLine(`   ${num} ${ANSI.cyan}${name}${ANSI.reset}`, val);
                writeLine(`       ${ANSI.dim}${desc}${ANSI.reset}`);
            } else {
                const pad = Math.max(1, 16 - name.length);
                writeLine(`   ${num} ${ANSI.cyan}${name}${ANSI.reset}${" ".repeat(pad)}${ANSI.dim}${desc}${ANSI.reset}`, val);
            }
        }

        writeBlank();
        writeLine(`  ${ANSI.dim}Click to view docs. ${ANSI.yellow}[B]ack${ANSI.reset}  ${ANSI.red}[Q]uit${ANSI.reset}`, "bq");
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
