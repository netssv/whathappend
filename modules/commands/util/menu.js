/**
 * @module modules/commands/util/menu.js
 * @description General interactive navigation menu for discovering platform commands.
 */

import { ANSI } from "../../formatter.js";

const CATEGORIES = [
    {
        name: "🌐 Audits & Core (Auditorías Completas)",
        desc: "Deep scans bundling multiple checks.",
        commands: [
            { cmd: "web", desc: "DNS, HTTP Headers, and SSL cert checks." },
            { cmd: "email", desc: "MX, SPF, DMARC, and DKIM discovery." },
            { cmd: "audit", desc: "Marketing Suite (SEO, OpenGraph, Schema)." },
            { cmd: "sec", desc: "Security scorecard (Headers, SSL)." }
        ]
    },
    {
        name: "📡 Network & DNS (Red y DNS)",
        desc: "Infrastructure routing and lookup tools.",
        commands: [
            { cmd: "dig", desc: "Full DNS lookup (e.g. dig mx)." },
            { cmd: "host", desc: "Quick A, AAAA, MX summary." },
            { cmd: "isup", desc: "Global reachability and downtime check." },
            { cmd: "ip", desc: "Show your public IP or resolve a domain's IP." },
            { cmd: "speedtest", desc: "Local bandwidth test." }
        ]
    },
    {
        name: "🛡️ Security & OSINT (Seguridad)",
        desc: "Vulnerability analysis and intelligence.",
        commands: [
            { cmd: "wayback", desc: "Archive.org timeline." },
            { cmd: "history", desc: "Certificate Transparency logs (creation date)." },
            { cmd: "csp", desc: "Content-Security-Policy analysis." },
            { cmd: "waf", desc: "Web Application Firewall detection." }
        ]
    },
    {
        name: "⚡ Performance & Web (Rendimiento)",
        desc: "Stack footprint and browser telemetry.",
        commands: [
            { cmd: "stack", desc: "Fingerprint tech stack (CMS, server, etc)." },
            { cmd: "vitals", desc: "Core Web Vitals scorecard." },
            { cmd: "load", desc: "Navigation Timing API metrics." },
            { cmd: "links", desc: "Mixed content (HTTP on HTTPS) scanner." }
        ]
    },
    {
        name: "💻 Terminal Tools (Herramientas)",
        desc: "System utilities and environment control.",
        commands: [
            { cmd: "tabs", desc: "Interactive Tab manager." },
            { cmd: "ext", desc: "External Tools launcher." },
            { cmd: "coffee", desc: "Pomodoro break timer." },
            { cmd: "config", desc: "View or change preferences." },
            { cmd: "help", desc: "Display full command reference." }
        ]
    }
];

export function cmdNavMenu() {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            _subWatcher: null,
            currentCategory: -1, // -1 means Root Menu

            start(term, doneCallback) {
                const draw = () => {
                    term.write("\x1b[2J\x1b[3J\x1b[H");

                    if (this.currentCategory === -1) {
                        let out = `\n  ${ANSI.bold}${ANSI.cyan}/// PLATFORM NAVIGATOR ///${ANSI.reset}  ${ANSI.dim}Main Menu${ANSI.reset}\n\n`;
                        out += `  Welcome to WhatHappened. Select a category to explore commands:\n\n`;

                        for (let i = 0; i < CATEGORIES.length; i++) {
                            out += `    ${ANSI.bold}[${i + 1}]${ANSI.reset} ${ANSI.white}${CATEGORIES[i].name}${ANSI.reset}\n`;
                            out += `        ${ANSI.dim}${CATEGORIES[i].desc}${ANSI.reset}\n`;
                        }

                        out += `\n  ${ANSI.dim}Press 1-${CATEGORIES.length} to select. 'Q' to quit.${ANSI.reset}\n`;
                        out += `  ${ANSI.dim}Tip: Press Ctrl+Shift+. anytime to toggle this panel.${ANSI.reset}\n`;
                        term.write(out);
                    } else {
                        const cat = CATEGORIES[this.currentCategory];
                        let out = `\n  ${ANSI.bold}${ANSI.cyan}/// ${cat.name.toUpperCase()} ///${ANSI.reset}\n\n`;
                        
                        for (let i = 0; i < cat.commands.length; i++) {
                            out += `    ${ANSI.bold}[${i + 1}]${ANSI.reset} ${ANSI.white}${cat.commands[i].cmd.padEnd(10)}${ANSI.reset} ${ANSI.dim}- ${cat.commands[i].desc}${ANSI.reset}\n`;
                        }

                        out += `\n  ${ANSI.dim}Press 1-${cat.commands.length} to run a command. 'B' to go back. 'Q' to quit.${ANSI.reset}\n`;
                        term.write(out);
                    }
                };

                this.onDataDisposable = term.onData(async (e) => {
                    const lower = e.toLowerCase();

                    // Quit
                    if (lower === "q" || e === "\x03") {
                        if (this.onDataDisposable) {
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                        }
                        doneCallback();
                        return;
                    }

                    if (this.currentCategory === -1) {
                        // In Root Menu
                        const num = parseInt(lower);
                        if (num >= 1 && num <= CATEGORIES.length) {
                            this.currentCategory = num - 1;
                            draw();
                        }
                    } else {
                        // In Sub Menu
                        if (lower === "b" || lower === "back") {
                            this.currentCategory = -1;
                            draw();
                            return;
                        }

                        const cat = CATEGORIES[this.currentCategory];
                        const num = parseInt(lower);
                        if (num >= 1 && num <= cat.commands.length) {
                            const cmdToRun = cat.commands[num - 1].cmd;

                            // Clean up this watcher temporarily to run the command
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                            term.write(`\n\n  ${ANSI.dim}Running: ${cmdToRun}...${ANSI.reset}\n`);

                            try {
                                const engine = await import("../../engine.js");
                                const res = await engine.executeCommand(cmdToRun);

                                if (typeof res === "object" && res?.__watch) {
                                    this._subWatcher = res.watcher;
                                    res.watcher.start(term, () => {
                                        this._subWatcher = null;
                                        // Some watchers (like ext) print output before calling doneCallback.
                                        // Wait for ANY KEY so the user can read the output.
                                        term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                        this.onDataDisposable = term.onData(() => {
                                            if (this.onDataDisposable) this.onDataDisposable.dispose();
                                            this.onDataDisposable = null;
                                            this.start(term, doneCallback);
                                        });
                                    });
                                } else {
                                    if (res && res !== "__CLEAR__") {
                                        term.write(`\n${res}\n`);
                                    }
                                    term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                    this.onDataDisposable = term.onData(() => {
                                        if (this.onDataDisposable) this.onDataDisposable.dispose();
                                        this.onDataDisposable = null;
                                        this.start(term, doneCallback);
                                    });
                                }
                            } catch (err) {
                                term.write(`\n${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n`);
                                term.write(`\n  ${ANSI.dim}Press ANY KEY to return to Menu...${ANSI.reset}`);
                                this.onDataDisposable = term.onData(() => {
                                    if (this.onDataDisposable) this.onDataDisposable.dispose();
                                    this.onDataDisposable = null;
                                    this.start(term, doneCallback);
                                });
                            }
                        }
                    }
                });

                draw();
            },

            stop(term) {
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
