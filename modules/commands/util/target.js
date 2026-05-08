/**
 * @module modules/commands/util/target.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - ContextManager from '../../context.js'
 * - Exports: cmdTarget
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { ContextManager } from "../../context.js";

// ===================================================================
//  target
// ===================================================================

export function cmdTarget(args) {
    if (args.length === 0) {
        const d = ContextManager.getDomain();
        const m = ContextManager.isManual() ? "manual" : "auto";
        if (!d) return `${ANSI.dim}No target. Usage: target <domain>${ANSI.reset}`;
        return `${ANSI.white}Target: ${ANSI.yellow}${d}${ANSI.reset} ${ANSI.dim}[${m}]${ANSI.reset}`;
    }
    if (args[0]==="auto"||args[0]==="reset") {
        ContextManager.resetToAuto();
        return `${ANSI.green}Target reset to auto (active tab).${ANSI.reset}`;
    }
    const domain = args[0].replace(/https?:\/\//, "").replace(/\/.*$/, "");
    if (!domain.includes('.') && !domain.includes(':') && domain !== 'localhost') {
        return `${ANSI.red}Invalid domain format.${ANSI.reset} A domain must contain a dot (e.g. google.com).`;
    }
    ContextManager.setManualTarget(domain);
    return `${ANSI.green}Target set: ${ANSI.yellow}${domain}${ANSI.reset} ${ANSI.dim}[manual]${ANSI.reset}`;
}
