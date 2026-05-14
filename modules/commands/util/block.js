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
import { ensureDebugger, getDebuggerFallbackMessage } from "./core/debugger-guard.js";

// Keep track of blocked URLs per tab
const blockedPatternsByTab = new Map();

async function attachDebugger(tabId) {
    try { await chrome.debugger.attach({ tabId }, "1.3"); } catch (err) { if (!err.message?.includes("already attached")) throw err; }
}

async function getShieldBlocks(tabId) {
    const blocks = [];
    try {
        const tab = await chrome.tabs.get(tabId);
        const primaryUrl = tab.url;
        const domain = new URL(primaryUrl).hostname;
        
        const contentSettings = ["javascript", "images", "cookies", "popups"];
        for (const api of contentSettings) { try { const res = await chrome.contentSettings[api].get({ primaryUrl }); if (res.setting === "block") blocks.push(api); } catch {} }
        
        try {
            const rules = await chrome.declarativeNetRequest.getSessionRules();
            if (rules.some(r => r.id === 1001 && r.condition.initiatorDomains?.includes(domain))) blocks.push("css");
            if (rules.some(r => r.id === 1002 && r.condition.initiatorDomains?.includes(domain))) blocks.push("fonts");
        } catch {}
    } catch {}
    return blocks;
}

export async function cmdBlock(args) {
    // ── Permission guard — request debugger on demand ──────────────────
    const granted = await ensureDebugger();
    if (!granted) {
        const tabId = await getActiveTabId();
        let domain = "";
        if (tabId) try { const tab = await chrome.tabs.get(tabId); domain = new URL(tab.url).hostname; } catch {}
        return getDebuggerFallbackMessage("block", domain);
    }

    if (args.length === 0) {
        return {
            __watch: true,
            watcher: {
                onDataDisposable: null,
                start: function(term, doneCallback) {
                    const draw = async () => {
                        const tabId = await getActiveTabId();
                        let currentPatterns = [];
                        let shieldBlocks = [];
                        if (tabId) {
                            currentPatterns = blockedPatternsByTab.get(tabId) || [];
                            shieldBlocks = await getShieldBlocks(tabId);
                        }

                        term.write('\x1b[2J\x1b[H');
                        let out = `\n  ${ANSI.bold}${ANSI.cyan}/// NETWORK BLOCKER ///${ANSI.reset}\n\n`;
                        
                        if (!currentPatterns.length && !shieldBlocks.length) out += `    ${ANSI.dim}No active rules.${ANSI.reset}\n\n`;
                        else {
                            out += `    ${ANSI.bold}Active Rules:${ANSI.reset}\n`;
                            shieldBlocks.forEach(p => out += `      ${ANSI.cyan}[Shield]${ANSI.reset} ${p}\n`);
                            currentPatterns.forEach(p => out += `      ${ANSI.red}[Debugger]${ANSI.reset} ${p}\n`);
                            out += `\n`;
                        }
                        
                        out += `    ${ANSI.bold}[1]${ANSI.reset} Block Analytics (*analytics*)\n`;
                        out += `    ${ANSI.bold}[2]${ANSI.reset} Block Images (*.png, *.jpg)\n`;
                        out += `    ${ANSI.bold}[3]${ANSI.reset} Block Scripts (*.js)\n`;
                        out += `    ${ANSI.bold}[4]${ANSI.reset} Block Trackers (*tracker*)\n`;
                        out += `    ${ANSI.bold}[C]${ANSI.reset} Clear all rules\n`;
                        
                        out += `\n  ${ANSI.dim}Press 1-4 to block, 'C' to clear, 'Q' to quit.${ANSI.reset}\n`;
                        term.write(out);
                    };

                    this.onDataDisposable = term.onData(async e => {
                        const lower = e.toLowerCase();
                        if (lower === 'q' || e === '\x03' || e === '\r' || e === '\n') return doneCallback();
                        if (lower === 'c') { await cmdBlock(["--clear"]); return draw(); }
                        
                        if (lower === '1') await cmdBlock(["*analytics*"]);
                        if (lower === '2') await cmdBlock(["*.png"]);
                        if (lower === '3') await cmdBlock(["*.js"]);
                        if (lower === '4') await cmdBlock(["*tracker*"]);
                        
                        if (['1', '2', '3', '4'].includes(lower)) draw();
                    });

                    draw();
                },
                stop: function(term) {
                    if (this.onDataDisposable) { this.onDataDisposable.dispose(); this.onDataDisposable = null; }
                    if (term) term.write(`\n\n  ${ANSI.dim}[Block manager exited]${ANSI.reset}\n`);
                }
            }
        };
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
            
            // Also clear Shield blocks (best-effort)
            try {
                const tab = await chrome.tabs.get(tabId);
                const primaryPattern = `${new URL(tab.url).protocol}//${new URL(tab.url).hostname}/*`;
                const contentSettings = ["javascript", "images", "cookies", "popups"];
                for (const api of contentSettings) {
                    await chrome.contentSettings[api].set({ primaryPattern, setting: "allow" });
                }
                const rules = await chrome.declarativeNetRequest.getSessionRules();
                const hostname = new URL(tab.url).hostname;
                for (const ruleId of [1001, 1002]) {
                    const rule = rules.find(r => r.id === ruleId);
                    if (rule) {
                        const domains = new Set(rule.condition.initiatorDomains || []);
                        domains.delete(hostname);
                        if (domains.size > 0) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId], addRules: [{ ...rule, condition: { ...rule.condition, initiatorDomains: Array.from(domains) } }] });
                        else await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
                    }
                }
                setTimeout(() => import("../../terminal/header-controller.js").then(m => m.updateBlockState(tab.url)), 100);
            } catch {}

            return `\n${ANSI.green}[OK]${ANSI.reset} All blocking rules cleared for this tab.`;
        }

        if (sub === "--list" || sub === "list" || sub === "ls") {
            const shieldBlocks = await getShieldBlocks(tabId);
            
            if (currentPatterns.length === 0 && shieldBlocks.length === 0) return `\n${ANSI.dim}No active blocks for this tab.${ANSI.reset}`;
            
            let o = `\n${ANSI.bold}Active Blocks:${ANSI.reset}\n`;
            shieldBlocks.forEach(p => o += `  ${ANSI.cyan}[Shield]${ANSI.reset} ${p}\n`);
            currentPatterns.forEach(p => o += `  ${ANSI.red}[Debugger]${ANSI.reset} ${p}\n`);
            return o;
        }

        // It's a pattern to add
        const pattern = args[0]; // keep original casing for pattern
        if (!currentPatterns.includes(pattern)) currentPatterns.push(pattern);

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
