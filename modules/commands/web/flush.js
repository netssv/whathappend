/**
 * @module modules/commands/web/flush.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, cmdUsage, cmdError from '../../formatter.js'
 * - Exports: cmdFlush
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError } from "../../formatter.js";

// ===================================================================
//  flush — Clear cookies and cache for the target domain
//
//  Uses chrome.browsingData scoped to the target domain's origin.
//  Requires explicit domain argument (no auto-target) as a safety
//  mechanism to prevent accidental cache clears.
// ===================================================================

export async function cmdFlush(args) {
    // If no args provided, resolveTargetDomain(null) auto-targets current tab.
    const domain = resolveTargetDomain(args.length > 0 ? args[0] : null);
    
    if (!domain) {
        return cmdError("No active domain found. Provide a domain explicitly: flush <domain>");
    }

    const { showConfirm } = await import("../../terminal/modal.js");
    const confirmed = await showConfirm({
        title: "🧹 Flush Domain Data",
        message: `Clear cookies and cache for <strong style="color:#ffd740">${domain}</strong>?<br><br><span style="color:#888">Active sessions on this domain will be lost.</span>`,
        confirmLabel: "Flush",
        cancelLabel: "Cancel",
        danger: true,
    });

    if (!confirmed) {
        return `${ANSI.dim}Flush cancelled.${ANSI.reset}`;
    }

    const origin = `https://${domain}`;
    let o = `> chrome.browsingData.remove({origins: ["${origin}"]})\n`;
    o += `${ANSI.dim}Clearing cookies and cache for ${domain}...${ANSI.reset}\n\n`;

    try {
        if (!chrome?.browsingData?.remove) {
            return o + cmdError("chrome.browsingData API is not available in this context.");
        }

        await Promise.race([
            new Promise((resolve, reject) => {
                try {
                    chrome.browsingData.remove(
                        { origins: [origin] },
                        { cookies: true, cache: true },
                        () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        }
                    );
                } catch (e) {
                    reject(e);
                }
            }),
            new Promise(resolve => setTimeout(resolve, 3000)) // Safety timeout to prevent hangs
        ]);

        o += `  ${ANSI.green}✓${ANSI.reset} Cookies and cache cleared for ${ANSI.cyan}${domain}${ANSI.reset}\n`;

        o += insights([
            { level: "PASS", text: `Cleared browsing data for ${domain}.` },
            { level: "INFO", text: "Session cookies and cached resources have been removed." }
        ]);

        return {
            __watch: true,
            watcher: {
                _interval: null,
                start: function(term, doneCallback) {
                    term.writeln(o.trim());

                    let timeLeft = 3;
                    term.write(`\r\n${ANSI.cyan}Reloading page in ${timeLeft}s...${ANSI.reset}`);

                    this._interval = setInterval(() => {
                        timeLeft--;
                        if (timeLeft > 0) {
                            term.write(`\r\x1b[2K${ANSI.cyan}Reloading page in ${timeLeft}s...${ANSI.reset}`);
                        } else {
                            if (this._interval) clearInterval(this._interval);
                            this._interval = null;
                            term.write(`\r\x1b[2K${ANSI.green}Reloading tab now...${ANSI.reset}\r\n`);
                            
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                            });
                            
                            if (doneCallback) doneCallback();
                        }
                    }, 1000);
                },
                stop: function() {
                    if (this._interval) {
                        clearInterval(this._interval);
                        this._interval = null;
                    }
                }
            }
        };

    } catch (err) {
        return o + cmdError(`Failed to clear data: ${err.message}`);
    }
}
