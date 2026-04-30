/**
 * @module modules/commands/util/notes.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, cmdUsage from '../../formatter.js'
 *     - pushNote, getNotes from '../../state.js'
 * - Exports: cmdNotes
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI, cmdUsage } from "../../formatter.js";
import { pushNote, getNotes } from "../../state.js";

// ===================================================================
//  notes — Add analyst annotations to the session report
//
//  notes                → List all notes
//  notes <text>         → Add a new note
// ===================================================================

export async function cmdNotes(args) {
    if (args.length === 0) return listNotes();

    const text = args.join(" ");
    pushNote(text);
    return `  ${ANSI.green}✓${ANSI.reset} Note added: ${ANSI.dim}${text}${ANSI.reset}\n`;
}

function listNotes() {
    const notes = getNotes();
    if (notes.length === 0) {
        return `${ANSI.dim}No notes yet. Add one with: notes <text>${ANSI.reset}\n`;
    }

    let o = `${ANSI.white}${ANSI.bold}  SESSION NOTES (${notes.length})${ANSI.reset}\n`;
    o += `  ${ANSI.dim}${"━".repeat(30)}${ANSI.reset}\n`;
    for (let i = 0; i < notes.length; i++) {
        o += `  ${ANSI.cyan}${(i + 1).toString().padStart(2)}.${ANSI.reset} ${notes[i].text}\n`;
        o += `     ${ANSI.dim}${notes[i].time}${ANSI.reset}\n`;
    }
    return o;
}
