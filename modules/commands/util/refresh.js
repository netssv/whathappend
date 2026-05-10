/**
 * @module modules/commands/util/refresh.js
 * @description Command to reload the active tab.
 */

import { ANSI } from "../../formatter.js";

export async function cmdRefresh() {
    let o = `\n  ${ANSI.cyan}Refreshing active tab...${ANSI.reset}\n`;
    
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
            const activeTab = tabs[0];
            await chrome.tabs.reload(activeTab.id);
            o += `  ${ANSI.green}[OK]${ANSI.reset} Tab reloaded: ${ANSI.dim}${activeTab.title || activeTab.url}${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.red}[ERROR] No active tab found to refresh.${ANSI.reset}\n`;
        }
    } catch (err) {
        o += `  ${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`;
    }

    return o;
}
