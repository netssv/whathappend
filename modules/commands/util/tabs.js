import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs — Manage open browser tabs
// ===================================================================

export async function cmdTabs(args) {
    if (args.length === 0 || args[0] === "list") {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve(`${ANSI.red}[ERROR] Could not retrieve tabs.${ANSI.reset}`);
                    return;
                }

                let output = `\n${ANSI.cyan}${ANSI.bold}[INFO] Open Tabs (${tabs.length}):${ANSI.reset}\n`;
                const maxTitleLen = 45;

                tabs.forEach((tab) => {
                    const isActive = tab.active ? ` ${ANSI.green}(Active)${ANSI.reset}` : "";
                    const idPad = tab.id.toString().padEnd(4, " ");
                    let title = tab.title || "Unknown";
                    if (title.length > maxTitleLen) title = title.substring(0, maxTitleLen - 3) + "...";
                    
                    output += `${ANSI.dim}[ID: ${idPad}]${ANSI.reset} ${title}${isActive}\n`;
                    output += `           ${ANSI.dim}↳ ${tab.url}${ANSI.reset}\n`;
                });

                output += `\n${ANSI.dim}To close a tab: ${ANSI.white}tabs close <ID>${ANSI.reset}`;
                resolve(output);
            });
        });
    }

    if (args[0] === "close") {
        if (args.length < 2) {
            return `${ANSI.red}[ERROR] Missing Tab ID. Usage: tabs close <ID>${ANSI.reset}`;
        }

        const tabId = parseInt(args[1], 10);
        if (isNaN(tabId)) {
            return `${ANSI.red}[ERROR] Invalid Tab ID: ${args[1]}${ANSI.reset}`;
        }

        return new Promise((resolve) => {
            chrome.tabs.remove(tabId, () => {
                if (chrome.runtime.lastError) {
                    resolve(`${ANSI.red}[ERROR] Failed to close tab: ${chrome.runtime.lastError.message}${ANSI.reset}`);
                } else {
                    resolve(`${ANSI.green}[SUCCESS] Tab [ID: ${tabId}] closed.${ANSI.reset}`);
                }
            });
        });
    }

    return `${ANSI.red}[ERROR] Unknown argument '${args[0]}'. Use 'tabs list' or 'tabs close <ID>'.${ANSI.reset}`;
}
