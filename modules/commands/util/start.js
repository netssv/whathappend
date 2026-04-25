import { ANSI } from "../../formatter.js";
import { ContextManager } from "../../context.js";

// ===================================================================
//  start / run — Quick-start analysis of the active tab
//
//  With no arguments: queries the active tab domain and triggers triage.
//  With a domain arg: behaves like `target <domain>` + triage.
// ===================================================================

export async function cmdStart(args) {
    // If a domain was provided, use it directly
    if (args.length > 0) {
        const domain = args[0];
        ContextManager.setManualTarget(domain);
        return { __switch: true, domain };
    }

    // No args — query the active tab
    try {
        const resp = await chrome.runtime.sendMessage({ command: "get-active-domain" });
        if (!resp?.domain) {
            return `${ANSI.red}[ERROR] No active tab detected.${ANSI.reset}\n${ANSI.dim}Open a website in a browser tab first.${ANSI.reset}`;
        }

        const domain = resp.domain;
        ContextManager.setManualTarget(domain);
        return { __switch: true, domain };
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message || "Failed to query active tab."}${ANSI.reset}`;
    }
}
