/**
 * @module modules/commands/util/help.js
 * @description Interactive help TUI (watcher mode) + flag-based text output.
 * @exports cmdHelp
 */

import { ANSI, isIPAddress } from "../../formatter.js";
import { ContextManager } from "../../context.js";
import { getTermCols } from "../../state.js";
import { HELP_SECTIONS } from "../../data/help-data.js";
import { HelpRenderer, HELP_CATEGORIES } from "./help-ui.js";

// ===================================================================
//  help — Interactive TUI (no args) | Text output (with flags)
// ===================================================================

export function cmdHelp(args = [], flags = []) {
    // Parse flag/query
    let query = "";
    if (flags.length > 0 && flags[0].startsWith("-")) {
        query = flags[0].replace(/^-+/, "").toLowerCase();
    } else if (args.length > 0) {
        query = args[0].toLowerCase();
    }

    // ── No query → launch interactive TUI ────────────────────────────
    if (!query) {
        return createHelpWatcher();
    }

    // ── Flag mode → text output (help -web, help -dns, etc.) ─────────
    return renderTextHelp(query);
}

// ── Interactive Watcher ──────────────────────────────────────────────

function createHelpWatcher() {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            _renderer: null,
            _mouseEnabled: false,

            start(term, doneCallback) {
                this._renderer = new HelpRenderer(term);
                this._renderer.draw(-1);

                term.write("\x1b[?1003h\x1b[?1006h");
                this._mouseEnabled = true;

                this.onDataDisposable = term.onData(async (e) => {
                    let lower = e.toLowerCase();

                    // SGR Mouse
                    if (e.startsWith("\x1b[<")) {
                        const m = e.match(/\x1b\[<(\d+);(\d+);(\d+)([mM])/);
                        if (m) {
                            const btn = parseInt(m[1]), x = parseInt(m[2]);
                            const rawY = parseInt(m[3]), isPress = m[4] === "M";
                            // Convert viewport Y to absolute buffer Y (accounts for scroll)
                            const absY = (term.buffer?.active?.baseY ?? 0) + rawY;
                            const action = this._renderer.getActionAt(absY, x);

                            if (btn === 35) {
                                if (action !== this._renderer.hoveredAction) {
                                    this._renderer.draw(this._renderer.currentSection, action);
                                }
                                return;
                            }
                            if (btn === 0 && isPress) {
                                if (action) lower = action; else return;
                            } else return;
                        }
                    }

                    if (lower === "q" || e === "\x03") {
                        this._dispose();
                        doneCallback();
                        return;
                    }

                    if (this._renderer.currentSection === -1) {
                        const num = parseInt(lower);
                        if (num >= 1 && num <= HELP_CATEGORIES.length) {
                            this._renderer.draw(num - 1);
                        }
                    } else {
                        if (lower === "b" || lower === "back") {
                            this._renderer.draw(-1);
                            return;
                        }

                        const num = parseInt(lower);
                        const cmdName = this._renderer.getCommandAt(num - 1);
                        if (cmdName) {
                            this._dispose();
                            if (this._mouseEnabled) {
                                term.write("\x1b[?1003l\x1b[?1006l");
                                this._mouseEnabled = false;
                            }

                            // Show detailed help (documentation), not execute
                            try {
                                const { cmdDetailedHelp } = await import("./detailed-help.js");
                                const { suggestCommand } = await import("../../core/parser.js");
                                const baseName = cmdName.split(" ")[0].toLowerCase();
                                const helpText = cmdDetailedHelp(baseName, suggestCommand);
                                if (helpText) term.write(`\n${helpText}\n`);
                            } catch (err) {
                                term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                            }
                            term.write(`\n  ${ANSI.dim}Press ANY KEY or click to return to Help...${ANSI.reset}`);

                            // Re-enable mouse so clicks also count as "any key"
                            term.write("\x1b[?1003h\x1b[?1006h");
                            this._mouseEnabled = true;

                            this.onDataDisposable = term.onData((ev) => {
                                // Accept any keypress OR any mouse button press
                                if (ev.startsWith("\x1b[<")) {
                                    const mp = ev.match(/\x1b\[<(\d+);.*;.*M/);
                                    if (!mp || parseInt(mp[1]) !== 0) return; // only left-click press
                                }
                                this._dispose();
                                if (this._mouseEnabled) {
                                    term.write("\x1b[?1003l\x1b[?1006l");
                                    this._mouseEnabled = false;
                                }
                                this.start(term, doneCallback);
                            });
                        }
                    }
                });
            },

            _dispose() {
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
            },

            stop(term) {
                if (this._mouseEnabled) {
                    term.write("\x1b[?1003l\x1b[?1006l");
                    this._mouseEnabled = false;
                }
                this._dispose();
            },
        },
    };
}

// ── Text Renderer (flag mode) ────────────────────────────────────────

function renderTextHelp(query) {
    const cols = getTermCols();
    const currentTarget = ContextManager.getDomain();
    const targetIsIP = currentTarget ? isIPAddress(currentTarget) : false;
    const domainOnly = ["email", "spf", "dmarc", "dkim", "openssl", "whois",
                        "audit", "pixels", "socials", "stack", "robots", "web", "sec"];

    let titles = [];
    if (query === "audit" || query === "audits") titles = ["AUDIT TOOLS"];
    else if (query === "dns") titles = ["DNS"];
    else if (query === "short" || query === "shortcuts") titles = ["DNS SHORTCUTS"];
    else if (query === "email" || query === "mail") titles = ["EMAIL"];
    else if (query === "web") titles = ["WEB TOOLS"];
    else if (query === "net" || query === "network") titles = ["NETWORK"];
    else if (query === "ext" || query === "external") titles = ["EXTERNAL"];
    else if (query === "util" || query === "utils") titles = ["UTIL"];
    else if (query === "all") titles = HELP_SECTIONS.map(s => s.title);
    else return `\n  ${ANSI.red}Unknown category: ${query}${ANSI.reset}\n  ${ANSI.dim}Type 'help' for categories.${ANSI.reset}\n`;

    let o = targetIsIP ? `\n${ANSI.yellow}  [WARNING] IP target — domain-only commands dimmed${ANSI.reset}\n` : "";

    for (const section of HELP_SECTIONS.filter(s => titles.includes(s.title))) {
        const sub = section.subtitle ? ` ${ANSI.dim}${section.subtitle}${ANSI.reset}` : "";
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, cols - 4))) + ANSI.reset;
        o += `\n${ANSI.white}${ANSI.bold}  ${section.title}${ANSI.reset}${sub}\n  ${sep}\n`;

        for (const [name, desc, aliases] of section.cmds) {
            const base = name.split(" ")[0].toLowerCase();
            const dim = targetIsIP && domainOnly.includes(base);
            const nc = dim ? ANSI.dim : ANSI.cyan;
            const tag = dim ? ` ${ANSI.yellow}[domain]${ANSI.reset}` : "";
            const pad = Math.max(1, 16 - name.length);
            o += `  ${nc}${name}${ANSI.reset}${" ".repeat(pad)}${ANSI.dim}${desc}${ANSI.reset}${tag}\n`;
            if (aliases) o += `  ${" ".repeat(16)}${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
        }
    }
    o += `\n${ANSI.dim}  Add ${ANSI.white}?${ANSI.dim} for details: ${ANSI.white}email?${ANSI.dim}  ${ANSI.white}mx?${ANSI.reset}\n`;
    return o;
}
