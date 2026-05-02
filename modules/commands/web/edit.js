/**
 * @module modules/commands/web/edit.js
 * @description Toggles document.designMode on the active tab.
 */

import { ANSI } from "../../formatter.js";

// --- Injection Script ---
function toggleDesignMode() {
    const currentState = document.designMode;
    const newState = currentState === "on" ? "off" : "on";
    document.designMode = newState;
    return newState;
}

export async function cmdEdit(args) {
    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Live Edit Mode (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}
  ${ANSI.bold}Status:${ANSI.reset}   ${ANSI.green}ENABLED${ANSI.reset}
  
  ${ANSI.white}You can now click anywhere on the page to type and edit text.${ANSI.reset}\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;

    try {
        const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleDesignMode });
        
        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Live Edit Mode${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}\n`;

        if (result === "on") {
            o += `  ${ANSI.bold}Status:${ANSI.reset}   ${ANSI.green}ENABLED${ANSI.reset}\n\n`;
            o += `  ${ANSI.white}You can now click anywhere on the page to type and edit text.${ANSI.reset}\n`;
            o += `  ${ANSI.dim}Run the command again to disable.${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.bold}Status:${ANSI.reset}   ${ANSI.yellow}DISABLED${ANSI.reset}\n\n`;
            o += `  ${ANSI.dim}The page has returned to its normal state.${ANSI.reset}\n`;
        }

        return o;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
