/**
 * @module modules/commands/util/exit.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - clearSession from '../../state.js'
 * - Exports: cmdExit
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { clearSession } from "../../state.js";
import { showConfirm } from "../../terminal/modal.js";

// ===================================================================
// exit — Confirm, clear session, and close terminal
// ===================================================================

export async function cmdExit() {
    const confirmed = await showConfirm({
        title: "👋 Exit Session",
        message: `This will <strong style="color:#ffd740">clear your session history</strong> and close the terminal panel.<br><br><span style="color:#888">All command history and triad data will be lost.</span>`,
        confirmLabel: "Exit",
        cancelLabel: "Stay",
        danger: true,
    });

    if (!confirmed) {
        return `${ANSI.dim}Exit cancelled.${ANSI.reset}`;
    }

    await clearSession();
    setTimeout(() => {
        window.close();
    }, 800);
    return `${ANSI.yellow}Session cleared.${ANSI.reset}\n${ANSI.dim}Closing terminal...${ANSI.reset}`;
}
