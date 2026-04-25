import { ANSI, getSeparator } from "../../formatter.js";
import { ContextManager } from "../../context.js";

// ===================================================================
//  switch — Adopt the current browser tab as the active target
//
//  Queries the background for the active tab's domain and sets it
//  as the manual target. Returns the domain so the engine can
//  trigger a progressive triage automatically.
// ===================================================================

export async function cmdSwitch() {
    try {
        const resp = await chrome.runtime.sendMessage({ command: "get-active-domain" });
        if (!resp?.domain) {
            return `${ANSI.red}[ERROR] No active tab detected.${ANSI.reset}\n${ANSI.dim}Open a website in a tab first.${ANSI.reset}`;
        }

        const domain = resp.domain;
        const current = ContextManager.getDomain();

        if (current === domain) {
            return `${ANSI.dim}Already targeting ${ANSI.yellow}${domain}${ANSI.dim} — no switch needed.${ANSI.reset}`;
        }

        // Set the new target — this triggers onTargetChanged in terminal-main.js
        ContextManager.setManualTarget(domain);

        // Return __SWITCH__ sentinel so the engine knows to run triage
        return { __switch: true, domain };
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message || "Failed to query active tab."}${ANSI.reset}`;
    }
}
