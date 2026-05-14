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
    menu.addEventListener("click", async (e) => {
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
                import("../terminal-ui.js").then(m => m.writePrompt());
            }

        // Flush command — modal confirmation
        } else if (cmd.startsWith("flush:")) {
            const targetType = cmd.split(":")[1];
            menu.classList.remove("open");
            closeLogo();

            let host = "";
            if (targetType === "tab") {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0] && tabs[0].url.startsWith("http")) {
                    host = new URL(tabs[0].url).hostname.replace(/^www\./, "");
                }
            } else if (targetType === "target") {
                const d = ContextManager.getDomain();
                if (d) host = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            }

            if (!host) {
                term.writeln(`\x1b[31m[ERROR] No valid domain found to flush.\x1b[0m`);
                term.focus();
                return;
            }

            const { showConfirm } = await import("../modal.js");
            const confirmed = await showConfirm({
                title: "⚠️ Flush Cache",
                message: `This will clear <strong style="color:#ff5252">all cookies, cache, and saved logins</strong> for:<br><br><strong style="color:#fff">${host}</strong><br><br><span style="color:#888">You will be logged out of this site.</span>`,
                confirmLabel: "Flush",
                cancelLabel: "Cancel",
                danger: true,
            });

            if (confirmed) {
                term.writeln(`\x1b[90m> Flushing cache for ${host}...\x1b[0m`);
                InputEvents.emitFromMenu(`flush ${host}`);
            }

        } else if (cmd.startsWith("tab_menu:")) {
            const parts = cmd.split(":");
            const tabId = parts[1];
            const host = parts.slice(2).join(":") || "internal";
            
            menu.classList.remove("open");
            closeLogo();

            const { showChoice } = await import("../modal.js");
            const choice = await showChoice({
                title: "🌐 Tab Action",
                message: `What would you like to do with <strong style="color:#ffd740">${host}</strong>?`,
                choices: [
                    { label: "Target Domain", value: "target" },
                    { label: "Go To Tab", value: "switch", primary: true }
                ]
            });

            if (choice === "target") {
                InputEvents.emitFromMenu(`target ${host}`);
            } else if (choice === "switch") {
                InputEvents.emitFromMenu(`tabs focus ${tabId}`);
            }

        } else {
            menu.classList.remove("open");
            closeLogo();
            InputEvents.emitFromMenu(cmd);
        }
        term.focus();
    });
}

function closeLogo() {
    const logo = document.getElementById("logo-wrapper");
    if (logo) logo.classList.remove("menu-active");
}
