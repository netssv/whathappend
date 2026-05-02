/**
 * @module modules/terminal/header/menu-delegation.js
 * @description Handles delegated click events for all data-cmd items in the menu.
 */

import { term } from "../terminal-ui.js";
import { InputEvents } from "../input/events.js";
import { applyTheme, getCurrentTheme } from "../theme-engine.js";
import { THEMES } from "../../data/themes.js";
import { ContextManager } from "../../context.js";

export function initMenuDelegation(menu) {
    menu.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-cmd]");
        if (!btn) return;
        e.stopPropagation();

        const cmd = btn.dataset.cmd;

        // Theme commands
        if (cmd.startsWith("theme:")) {
            menu.classList.remove("open");
            const themeId = cmd.split(":")[1];
            if (getCurrentTheme() !== themeId) {
                applyTheme(themeId);
                term.writeln(`\x1b[32m✓\x1b[0m Theme set to \x1b[33m${THEMES[themeId]?.name || themeId}\x1b[0m`);
            }
        // Flush command requires 2-step confirmation
        } else if (cmd.startsWith("flush:")) {
            const targetType = cmd.split(":")[1];

            if (!btn.classList.contains("confirm-flush")) {
                e.stopPropagation();
                btn.classList.add("confirm-flush");
                btn.dataset.originalHtml = btn.innerHTML;
                
                btn.innerHTML = `<span style="color:#ff6b6b">⚠️</span> <span style="color:#ff6b6b">Clears logins! Sure?</span>`;
                btn.style.background = "rgba(255, 100, 100, 0.15)";
                
                setTimeout(() => {
                    if (!btn.classList.contains("confirm-flush")) return;
                    btn.classList.remove("confirm-flush");
                    btn.innerHTML = btn.dataset.originalHtml;
                    btn.style.background = "";
                }, 3000);
                return;
            }

            menu.classList.remove("open");
            btn.classList.remove("confirm-flush");
            btn.innerHTML = btn.dataset.originalHtml;
            btn.style.background = "";

            if (targetType === "tab") {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].url.startsWith("http")) {
                        const host = new URL(tabs[0].url).hostname.replace(/^www\./, "");
                        term.writeln(`\x1b[90m> Initiating cache flush for ${host}...\x1b[0m`);
                        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `flush ${host}`);
                    } else {
                        term.writeln(`\x1b[31m[ERROR] Cannot flush cache: No valid active tab found.\x1b[0m`);
                    }
                });
            } else if (targetType === "target") {
                const targetDomain = ContextManager.getDomain();
                if (targetDomain) {
                    const host = targetDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                    term.writeln(`\x1b[90m> Initiating cache flush for ${host}...\x1b[0m`);
                    InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, `flush ${host}`);
                } else {
                    term.writeln(`\x1b[31m[ERROR] Cannot flush cache: No active target domain set.\x1b[0m`);
                }
            }
        } else {
            menu.classList.remove("open");
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, cmd);
        }
        term.focus();
    });
}
