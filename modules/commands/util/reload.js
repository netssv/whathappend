/**
 * @module modules/commands/util/reload.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Exports: cmdReload
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";

// ===================================================================
//  reload — Extension Hard Reboot
// ===================================================================

export async function cmdReload() {
    let o = `\n${ANSI.cyan}Initiating hard reboot...${ANSI.reset}\n`;
    o += `${ANSI.dim}Clearing memory and reloading extension context.${ANSI.reset}\n`;
    
    // Give the terminal a split second to render the message before killing the context
    setTimeout(() => {
        chrome.runtime.reload();
    }, 250);

    return o;
}
