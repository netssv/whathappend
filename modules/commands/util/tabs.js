/**
 * @module modules/commands/util/tabs.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - tabInfo from './tabs-info.js'
 *     - tabDiag from './tabs-diag.js'
 *     - createTabWatcher from './tabs-watch.js'
 *     - tabBlock from './tabs-block.js'
 * - Exports: cmdTabs
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { tabInfo } from "./tabs-info.js";
import { tabDiag } from "./tabs-diag.js";
import { createTabWatcher } from "./tabs-watch.js";
import { tabBlock } from "./tabs-block.js";

// tabs — Unified tab manager (list, close, info, diag, watch, block, sleep, focus)

let _indexMap = [];  // Maps short index → real chrome tab ID

function icon(tab) {
    if (tab.active) return `${ANSI.green}●${ANSI.reset}`;
    if (tab.audible) return `${ANSI.green}♪${ANSI.reset}`;
    if (tab.status === "loading") return `${ANSI.cyan}◌${ANSI.reset}`;
    if (tab.discarded) return `${ANSI.yellow}z${ANSI.reset}`;
    return `${ANSI.dim}Z${ANSI.reset}`;
}

async function buildIndexMap() {
    const tabs = await chrome.tabs.query({});
    _indexMap = [];
    let idx = 1;
    for (const tab of tabs) { _indexMap[idx++] = tab.id; }
}

async function resolveTabId(input) {
    const n = parseInt(input, 10);
    if (isNaN(n)) return null;
    // Auto-build map if not populated yet
    if (_indexMap.length === 0) await buildIndexMap();
    // If it looks like a short index (1-999), resolve from cache
    if (n < 1000 && _indexMap[n] !== undefined) return _indexMap[n];
    // Otherwise treat as raw Chrome tab ID
    return n;
}

export async function cmdTabs(args) {
    const sub = args[0]?.toLowerCase();

    // ── INTERACTIVE MENU ─────────────────────────────────────────
    if (!sub) {
        return {
            __watch: true,
            watcher: {
                onDataDisposable: null,
                start: function(term, doneCallback) {
                    let tabsList = [];
                    let message = "";
                    let currentMode = "focus";
                    
                    const fetchAndDraw = () => {
                        chrome.tabs.query({}, (tabs) => {
                            tabsList = tabs;
                            // Ensure _indexMap is populated so we can just call cmdTabs
                            _indexMap = [];
                            let idx = 1;
                            for (const tab of tabs) { _indexMap[idx++] = tab.id; }
                            
                            term.write('\x1b[2J\x1b[H');
                            let out = `\n  ${ANSI.bold}${ANSI.cyan}/// TAB MANAGER ///${ANSI.reset}  ${ANSI.dim}${tabs.length} open${ANSI.reset}\n\n`;
                            
                            for (let i = 0; i < Math.min(tabs.length, 9); i++) {
                                const tab = tabs[i];
                                let title = tab.title || "Untitled";
                                if (title.length > 30) title = title.substring(0, 29) + "…";
                                
                                out += `    ${ANSI.bold}[${i+1}]${ANSI.reset} ${icon(tab)} ${title}\n`;
                            }
                            
                            if (tabs.length > 9) {
                                out += `    ${ANSI.dim}...and ${tabs.length - 9} more tabs.${ANSI.reset}\n`;
                            }
                            
                            const modeMap = {
                                focus: "Focus (Switch)",
                                close: "Close (Kill)",
                                info: "Info (Metadata)",
                                diag: "Diag (Health)",
                                watch: "Watch (Live)",
                                block: "Block (Network)",
                                sleep: "Sleep (Memory)"
                            };
                            
                            if (message) {
                                out += `\n  ${ANSI.yellow}${message}${ANSI.reset}\n`;
                                message = "";
                            } else {
                                out += `\n`;
                            }
                            
                            out += `  ${ANSI.bold}Mode: ${ANSI.yellow}${modeMap[currentMode]}${ANSI.reset}\n`;
                            out += `  ${ANSI.dim}Actions: [F]ocus [C]lose [I]nfo [D]iag [W]atch [B]lock [S]leep${ANSI.reset}\n`;
                            out += `  ${ANSI.dim}Press 1-9 to apply. 'Q' to quit.${ANSI.reset}\n`;
                            term.write(out);
                        });
                    };

                    this.onDataDisposable = term.onData(async e => {
                        const lower = e.toLowerCase();
                        if (lower === 'q' || e === '\x03' || e === '\r' || e === '\n') {
                            doneCallback();
                            return;
                        }
                        
                        // Mode switching
                        const modeSwitches = {
                            'f': 'focus', 'c': 'close', 'i': 'info', 
                            'd': 'diag', 'w': 'watch', 'b': 'block', 's': 'sleep'
                        };
                        
                        if (modeSwitches[lower]) {
                            currentMode = modeSwitches[lower];
                            fetchAndDraw();
                            return;
                        }
                        
                        const num = parseInt(lower);
                        if (num >= 1 && num <= 9 && num <= tabsList.length) {
                            // Focus or Close can be fast without exiting the menu for fluidity
                            if (currentMode === "focus") {
                                const tabId = tabsList[num - 1].id;
                                chrome.tabs.update(tabId, { active: true });
                                chrome.windows.update(tabsList[num-1].windowId, { focused: true });
                                message = `Focused tab ${num}.`;
                                fetchAndDraw();
                                return;
                            } else if (currentMode === "close") {
                                const tabId = tabsList[num - 1].id;
                                chrome.tabs.remove(tabId, () => {
                                    message = `Closed tab ${num}.`;
                                    fetchAndDraw();
                                });
                                return;
                            }

                            // For other commands (info, diag, watch, block, sleep), run them via cmdTabs and exit menu
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                            
                            term.write(`\n\n  ${ANSI.dim}Running: tabs ${currentMode} ${num}...${ANSI.reset}\n`);
                            
                            try {
                                const res = await cmdTabs([currentMode, num.toString()]);
                                if (typeof res === "object" && res.__watch) {
                                    // Hand off to the new watcher
                                    this._subWatcher = res.watcher;
                                    res.watcher.start(term);
                                    
                                    // Listen for Q or Ctrl+C to exit sub-watcher and return to menu
                                    this.onDataDisposable = term.onData(subEvent => {
                                        const subLower = subEvent.toLowerCase();
                                        if (subLower === 'q' || subEvent === '\x03') {
                                            if (this._subWatcher) {
                                                this._subWatcher.stop(term);
                                                this._subWatcher = null;
                                            }
                                            this.onDataDisposable.dispose();
                                            this.onDataDisposable = null;
                                            this.start(term, doneCallback);
                                        }
                                    });
                                } else {
                                    // Print result and wait for a keypress to return
                                    term.write(`\n${res}\n`);
                                    term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Tabs Menu...${ANSI.reset}`);
                                    
                                    this.onDataDisposable = term.onData(() => {
                                        this.onDataDisposable.dispose();
                                        this.onDataDisposable = null;
                                        this.start(term, doneCallback);
                                    });
                                }
                            } catch (err) {
                                term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                                term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Tabs Menu...${ANSI.reset}`);
                                this.onDataDisposable = term.onData(() => {
                                    this.onDataDisposable.dispose();
                                    this.onDataDisposable = null;
                                    this.start(term, doneCallback);
                                });
                            }
                        }
                    });

                    fetchAndDraw();
                },
                stop: function(term) {
                    if (this._subWatcher) {
                        this._subWatcher.stop(term);
                        this._subWatcher = null;
                    }
                    if (this.onDataDisposable) {
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                    }
                }
            }
        };
    }

    // ── LIST ─────────────────────────────────────────────────────
    if (sub === "list") {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                if (!tabs?.length) {
                    resolve(`${ANSI.red}[ERROR] No tabs found.${ANSI.reset}`);
                    return;
                }

                // Build index map and group by host
                _indexMap = [];
                const groups = new Map();
                let idx = 1;

                for (const tab of tabs) {
                    _indexMap[idx] = tab.id;
                    tab._idx = idx++;
                    let host = "";
                    try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = "internal"; }
                    if (!groups.has(host)) groups.set(host, []);
                    groups.get(host).push(tab);
                }

                let o = `\n${ANSI.cyan}${ANSI.bold}  Tabs${ANSI.reset} ${ANSI.dim}${tabs.length} open · ${groups.size} sites${ANSI.reset}\n`;

                for (const [host, hostTabs] of groups) {
                    const count = hostTabs.length > 1 ? ` ${ANSI.dim}(${hostTabs.length})${ANSI.reset}` : "";
                    o += `\n  ${ANSI.cyan}${host}${ANSI.reset}${count}\n`;

                    for (const tab of hostTabs) {
                        const num = `${ANSI.dim}${String(tab._idx).padStart(2)}${ANSI.reset}`;
                        let title = tab.title || "Untitled";
                        if (title.length > 28) title = title.substring(0, 27) + "…";
                        o += `  ${num} ${icon(tab)} ${title}\n`;
                    }
                }

                o += `\n${ANSI.dim}  ${ANSI.green}●${ANSI.dim}active ${ANSI.reset}${ANSI.dim}Z${ANSI.dim}idle ${ANSI.yellow}z${ANSI.dim}sleep ${ANSI.green}♪${ANSI.dim}audio ${ANSI.cyan}◌${ANSI.dim}loading${ANSI.reset}\n`;
                o += `${ANSI.dim}  close · info · diag · watch · block · sleep · focus${ANSI.reset}\n`;
                resolve(o);
            });
        });
    }

    // ── CLOSE ────────────────────────────────────────────────────
    if (sub === "close") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs close <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";

            const { showConfirm } = await import("../../terminal/modal.js");
            const confirmed = await showConfirm({
                title: "❌ Close Tab",
                message: `Close tab <strong style="color:#ffd740">${title}</strong>?<br><span style="color:#888">${tab.url}</span>`,
                confirmLabel: "Close",
                cancelLabel: "Cancel",
                danger: true
            });

            if (!confirmed) {
                return `${ANSI.dim}Cancelled.${ANSI.reset}`;
            }

            return new Promise((resolve) => {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) {
                        resolve(`${ANSI.red}[ERROR] ${chrome.runtime.lastError.message}${ANSI.reset}`);
                    } else {
                        resolve(`${ANSI.green}[OK]${ANSI.reset} Closed: ${title}`);
                    }
                });
            });
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── INFO ─────────────────────────────────────────────────────
    if (sub === "info") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs info <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabInfo(tabId, args[1]);
    }

    // ── SLEEP (discard tab to free memory) ───────────────────────
    if (sub === "sleep" || sub === "discard") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs sleep <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            if (tab.active) return `${ANSI.yellow}[WARN]${ANSI.reset} Cannot sleep the active tab.`;
            if (tab.discarded) return `${ANSI.dim}Tab is already sleeping.${ANSI.reset}`;

            await chrome.tabs.discard(tabId);
            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";
            return `${ANSI.green}[OK]${ANSI.reset} ${title} ${ANSI.dim}→ sleeping${ANSI.reset}`;
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── FOCUS (switch browser to this tab) ───────────────────────
    if (sub === "focus" || sub === "goto" || sub === "switch") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs focus <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            const tab = await chrome.tabs.get(tabId);
            await chrome.tabs.update(tabId, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });

            let title = tab.title || "Untitled";
            if (title.length > 30) title = title.substring(0, 29) + "…";
            return `${ANSI.green}[OK]${ANSI.reset} Focused: ${title}`;
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── DIAG (inject health-check into the tab) ─────────────────
    if (sub === "diag" || sub === "health" || sub === "check") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs diag <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabDiag(tabId, args[1]);
    }

    // ── WATCH (live monitor) ─────────────────────────────────────
    if (sub === "watch" || sub === "monitor" || sub === "top") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs watch <#>${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;

        try {
            await chrome.tabs.get(tabId); // validate tab exists
            const watcher = createTabWatcher(tabId, args[1]);
            return { __watch: true, watcher };
        } catch (err) {
            return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
        }
    }

    // ── BLOCK (toggle JS, images, popups) ─────────────────────
    if (sub === "block" || sub === "unblock") {
        if (args.length < 2) return `${ANSI.red}Usage: tabs block <#> [js|images|popups|all|none]${ANSI.reset}`;
        const tabId = await resolveTabId(args[1]);
        if (!tabId) return `${ANSI.red}[ERROR] Invalid: ${args[1]}${ANSI.reset}`;
        return await tabBlock(tabId, args[1], args.slice(2));
    }

    return `${ANSI.red}Try: tabs · close · info · diag · watch · block · sleep · focus${ANSI.reset}`;
}
