/**
 * @module modules/commands/util/start.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - ContextManager from '../../context.js'
 * - Exports: cmdStart
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { ContextManager } from "../../context.js";

// ===================================================================
//  start / run — Quick-start analysis of the active tab
//
//  With no arguments: queries the active tab domain and triggers triage.
//  With a domain arg: behaves like `target <domain>` + triage.
// ===================================================================

export async function cmdStart(args) {
    if (args.length > 0) {
        const domain = args[0];
        ContextManager.setManualTarget(domain);
        return { __switch: true, domain: domain + " --go" };
    }

    // 2. If no args, use the current target
    const domain = ContextManager.getDomain();
    
    if (!domain || domain === "restricted") {
        return `${ANSI.red}[ERROR] No active target detected.${ANSI.reset}\n${ANSI.dim}Open a website or use 'target <domain>' first.${ANSI.reset}`;
    }

    return { __switch: true, domain: domain + " --go" };
}
