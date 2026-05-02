/**
 * @module modules/commands/util/block.js
 * @description Network request blocking via chrome.debugger + Network.setBlockedURLs.
 *
 * Usage:
 *   block *.js           → Block all JS
 *   block *analytics*    → Block analytics
 *   block --list         → List active blocked patterns
 *   block --clear        → Clear all blocked patterns
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            getActiveTabId, listTabOptions from './core/ua-engine.js'
 * - Exports: cmdBlock
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { getActiveTabId, listTabOptions } from "./core/ua-engine.js";
import { setEmulation, clearEmulation } from "../../terminal/header/header-emulation.js";

// Keep track of blocked URLs per tab
const blockedPatternsByTab = new Map();

async function attachDebugger(tabId) {
    try {
        await chrome.debugger.attach({ tabId }, "1.3");
    } catch (err) {
        if (!err.message?.includes("already attached")) throw err;
    }
}

export async function cmdBlock(args) {
    if (args.length === 0) {
        return `\n${ANSI.cyan}${ANSI.bold}  Network Blocker${ANSI.reset}
${ANSI.dim}  Blocks network requests using CDP Network.setBlockedURLs.${ANSI.reset}
${ANSI.dim}  Useful for identifying resources impacting LCP or security.${ANSI.reset}

${ANSI.bold}  Usage:${ANSI.reset}
  ${ANSI.white}block <pattern>${ANSI.dim}       · Add a blocking pattern (e.g. *.js, *analytics*, *.png)${ANSI.reset}
  ${ANSI.white}block --list${ANSI.dim}          · List active blocked patterns for current tab${ANSI.reset}
  ${ANSI.white}block --clear${ANSI.dim}         · Clear all blocks for current tab${ANSI.reset}

${ANSI.dim}  Check the Network tab in DevTools to see 'Blocked by Inspector'.${ANSI.reset}`;
    }

    const sub = args[0].toLowerCase();
    
    // We parse 'tab=' arg if present
    const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
    let tabId;
    if (tabArg) {
        const { indexMap } = await listTabOptions();
        tabId = indexMap[parseInt(tabArg, 10)] ?? parseInt(tabArg, 10);
    } else {
        tabId = await getActiveTabId();
    }

    if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;

    try {
        await attachDebugger(tabId);
        // Ensure Network is enabled to block URLs
        await chrome.debugger.sendCommand({ tabId }, "Network.enable");

        let currentPatterns = blockedPatternsByTab.get(tabId) || [];

        if (sub === "--clear" || sub === "clear" || sub === "reset") {
            await chrome.debugger.sendCommand({ tabId }, "Network.setBlockedURLs", { urls: [] });
            blockedPatternsByTab.delete(tabId);
            clearEmulation("block");
            return `\n${ANSI.green}[OK]${ANSI.reset} All blocking rules cleared for this tab.`;
        }

        if (sub === "--list" || sub === "list" || sub === "ls") {
            if (currentPatterns.length === 0) {
                return `\n${ANSI.dim}No active blocks for this tab.${ANSI.reset}`;
            }
            let o = `\n${ANSI.bold}Active Blocks:${ANSI.reset}\n`;
            currentPatterns.forEach(p => o += `  ${ANSI.red}✗${ANSI.reset} ${p}\n`);
            return o;
        }

        // It's a pattern to add
        const pattern = args[0]; // keep original casing for pattern
        if (!currentPatterns.includes(pattern)) {
            currentPatterns.push(pattern);
        }

        await chrome.debugger.sendCommand({ tabId }, "Network.setBlockedURLs", { urls: currentPatterns });
        blockedPatternsByTab.set(tabId, currentPatterns);
        
        const label = currentPatterns.length === 1 ? currentPatterns[0] : `${currentPatterns.length} Rules`;
        setEmulation("block", label);

        return `\n${ANSI.green}[OK]${ANSI.reset} Blocking added: ${ANSI.cyan}${pattern}${ANSI.reset}
${ANSI.dim}Use 'block --list' to view all, or 'block --clear' to reset.${ANSI.reset}
${ANSI.dim}You may need to reload the page to see effects.${ANSI.reset}`;
    } catch (err) {
        return `\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n${ANSI.dim}Tip: Close DevTools on that tab first.${ANSI.reset}`;
    }
}
