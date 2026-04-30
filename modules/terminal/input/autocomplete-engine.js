/**
 * @module modules/terminal/input/autocomplete-engine.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - InputEvents from './events.js'
 *     - ContextManager from '../../context.js'
 *     - AVAILABLE_COMMANDS, DOMAIN_COMMANDS, RAW_SNIPPETS, SUBCOMMAND_MAP from '../../data/autocomplete-data.js'
 * - Exports: initAutocompleteEngine
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

import { InputEvents } from "./events.js";
import { ContextManager } from "../../context.js";
import { AVAILABLE_COMMANDS, DOMAIN_COMMANDS, RAW_SNIPPETS, SUBCOMMAND_MAP } from "../../data/autocomplete-data.js";

function getLongestCommonPrefix(words) {
    if (!words || words.length === 0) return "";
    let prefix = words[0];
    for (let i = 1; i < words.length; i++) {
        while (words[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === "") return "";
        }
    }
    return prefix;
}



let tabCycleMatches = [];
let tabCycleIndex = -1;

export function initAutocompleteEngine() {
    InputEvents.on(InputEvents.EV_TAB_PRESSED, (currentLine) => {
        const input = currentLine.trimStart();
        if (!input) return;

        // If we are already cycling, continue cycling and ignore other logic
        if (tabCycleMatches.length > 0) {
            tabCycleIndex = (tabCycleIndex + 1) % tabCycleMatches.length;
            InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
            return;
        }

        const rawParts = input.split(/\s+/);
        const parts = input.trim().split(/\s+/);
        const hasTrailingSpace = input.endsWith(" ");

        const commandMatches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
        const isDomainCmd = DOMAIN_COMMANDS.includes(parts[0].toLowerCase());
        const canDomainFill = isDomainCmd && (hasTrailingSpace || commandMatches.length === 1);

        // Auto-fill context domain if command is fully typed
        // Prioritize command autocomplete if there are longer command matches, unless there's a trailing space
        if (parts.length === 1 && (rawParts.length === 1 || (rawParts.length === 2 && rawParts[1] === "")) && canDomainFill) {
            const domain = ContextManager.getDomain();
            if (domain) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, parts[0] + " " + domain + " ");
                return;
            }
        }

        // ── Domain Flag Autocompletion (e.g., google.com -vitals) ──
        const isDomain = /^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i.test(parts[0]);
        if (isDomain && parts.length <= 2) {
            const CHAIN_FLAGS = ["-go", "-vitals", "-cwv", "-ip", "-myip", "-whois", "-registrar", "-hosting", "-ssl", "-cert", "-headers", "-stack", "-wappalyzer"];
            const partial = parts.length === 2 ? parts[1].toLowerCase() : (hasTrailingSpace ? "-" : "");
            
            if (partial.startsWith("-")) {
                const matches = CHAIN_FLAGS.filter(f => f.startsWith(partial));
                if (matches.length === 1) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${parts[0]} ${matches[0]} `);
                    return;
                } else if (matches.length > 1) {
                    const prefix = getLongestCommonPrefix(matches);
                    if (prefix.length > partial.length) {
                        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${parts[0]} ${prefix}`);
                    } else {
                        // Dynamic inline autocomplete (CachyOS style)
                        tabCycleMatches = matches.map(m => `${parts[0]} ${m} `);
                        tabCycleIndex = 0;
                        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
                    }
                    return;
                }
            }
        }

        // ── Subcommand completion: config <key> ─────────────────────
        const baseCmd = parts[0].toLowerCase();
        if (SUBCOMMAND_MAP[baseCmd] && parts.length <= 2) {
            const subKeys = SUBCOMMAND_MAP[baseCmd];
            const partial = parts.length === 2 ? parts[1].toLowerCase() : "";

            const matches = subKeys.filter(k => k.startsWith(partial));
            if (matches.length === 0) return;

            if (matches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${baseCmd} ${matches[0]} `);
            } else {
                const prefix = getLongestCommonPrefix(matches);
                if (prefix.length > partial.length) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${baseCmd} ${prefix}`);
                } else {
                    // Dynamic inline autocomplete (CachyOS style)
                    tabCycleMatches = matches.map(m => `${baseCmd} ${m} `);
                    tabCycleIndex = 0;
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
                }
            }
            return;
        }

        // ── Bash Snippet Completion (Matches Full String) ──
        if (input.includes(" ") || input.includes("-")) {
            const snippetMatches = RAW_SNIPPETS.filter(s => s.toLowerCase().startsWith(input.toLowerCase()));
            if (snippetMatches.length === 1) {
                InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, snippetMatches[0]);
                return;
            } else if (snippetMatches.length > 1) {
                const prefix = getLongestCommonPrefix(snippetMatches);
                if (prefix.length > input.length) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, prefix);
                } else {
                    // Dynamic inline autocomplete (CachyOS style)
                    tabCycleMatches = snippetMatches;
                    tabCycleIndex = 0;
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
                }
                return;
            }
        }

        // Standard command prefix completion
        if (parts.length === 1 && !hasTrailingSpace) {
            const matches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(input.toLowerCase()));
            
            // Asynchronously fetch all open tabs to suggest any open domains
            chrome.tabs.query({}, (tabs) => {
                const openDomains = new Set();
                const activeDomain = ContextManager.getDomain();
                if (activeDomain) openDomains.add(activeDomain);

                if (tabs) {
                    tabs.forEach(tab => {
                        if (tab.url && tab.url.startsWith("http")) {
                            try {
                                const url = new URL(tab.url);
                                openDomains.add(url.hostname.replace(/^www\./, ""));
                            } catch(e) {}
                        }
                    });
                }

                openDomains.forEach(domain => {
                    if (domain.toLowerCase().startsWith(input.toLowerCase()) && !matches.includes(domain)) {
                        matches.push(domain);
                    }
                });

                if (matches.length === 1) {
                    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, matches[0] + " ");
                } else if (matches.length > 1) {
                    const prefix = getLongestCommonPrefix(matches);

                    if (prefix.length > input.length) {
                        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, prefix);
                    } else {
                        // Dynamic inline autocomplete (CachyOS style)
                        tabCycleMatches = matches.map(m => m + " ");
                        tabCycleIndex = 0;
                        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, tabCycleMatches[tabCycleIndex]);
                    }
                }
            });
            return;
        }
    });

    // Reset cycle state on any other input event
    const resetCycle = () => {
        tabCycleMatches = [];
        tabCycleIndex = -1;
    };
    InputEvents.on(InputEvents.EV_KEY_TYPED, resetCycle);
    InputEvents.on(InputEvents.EV_PASTE_TEXT, resetCycle);
    InputEvents.on(InputEvents.EV_HISTORY_NAVIGATE, resetCycle);
}
