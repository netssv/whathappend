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
    ContextManager.setManualTarget(args[0]);
    return `${ANSI.green}Target set: ${ANSI.yellow}${args[0]}${ANSI.reset} ${ANSI.dim}[manual]${ANSI.reset}`;
}
