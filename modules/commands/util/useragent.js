/**
 * @module modules/commands/util/useragent.js
 * @description Select a popular User Agent preset, pick an active tab, and reload.
 *
 * Usage:
 *   ua                  → list desktop agents + active tabs to pick from
 *   ua <n> [tab=<t>]    → apply UA #n to tab #t (default: active tab)
 *   ua reset [tab=<t>]  → remove UA override and reload
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            DESKTOP_AGENTS from '../../data/useragent-data.js'
 *            listTabOptions, applyUAToTab, resetUA, getActiveTabId from './core/ua-engine.js'
 * - Exports: cmdUserAgent
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { DESKTOP_AGENTS } from "../../data/useragent-data.js";
import { listTabOptions, applyUAToTab, resetUA, getActiveTabId } from "./core/ua-engine.js";
import { setEmulation } from "../../terminal/header/header-emulation.js";

export async function cmdUserAgent(args) {
    const sub = args[0]?.toLowerCase();

    // ── RESET ──────────────────────────────────────────────────────────
    if (sub === "reset" || sub === "clear" || sub === "off") {
        // Optional: ua reset tab=3
        const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
        const tabId = tabArg ? parseInt(tabArg, 10) : await getActiveTabId();
        if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;
        return await resetUA(tabId);
    }

    // ── LIST (no args or invalid first arg) ───────────────────────────
    const agentIdx = parseInt(sub, 10);
    if (!sub || isNaN(agentIdx)) {
        const { lines, indexMap } = await listTabOptions();

        let o = `\n${ANSI.cyan}${ANSI.bold}  User Agent Selector${ANSI.reset}\n`;
        o += `${ANSI.dim}  Applies a UA override via debugger and reloads the tab.${ANSI.reset}\n\n`;

        o += `${ANSI.bold}  Desktop Agents${ANSI.reset}\n`;
        DESKTOP_AGENTS.forEach((a, i) => {
            o += `  ${ANSI.dim}${String(i + 1).padStart(2)}${ANSI.reset}  ${a.label}\n`;
        });

        o += `\n${ANSI.bold}  Active Tabs${ANSI.reset}\n`;
        o += lines.join("\n") + "\n";

        o += `\n${ANSI.dim}Usage: ${ANSI.white}ua <agent#> [tab=<tab#>]${ANSI.dim}  · default tab = active tab${ANSI.reset}\n`;
        o += `${ANSI.dim}       ${ANSI.white}ua reset${ANSI.dim}              · restore browser default UA${ANSI.reset}`;
        return o;
    }

    // ── APPLY ──────────────────────────────────────────────────────────
    const agent = DESKTOP_AGENTS[agentIdx - 1];
    if (!agent) {
        return `${ANSI.red}[ERROR] Agent #${agentIdx} not found. Run ${ANSI.white}ua${ANSI.red} to see available options.${ANSI.reset}`;
    }

    // Resolve tab: "tab=3" arg or fallback to active tab
    const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
    let tabId;

    if (tabArg) {
        // Build the tab index map to resolve short indexes
        const { indexMap } = await listTabOptions();
        tabId = indexMap[parseInt(tabArg, 10)] ?? parseInt(tabArg, 10);
    } else {
        tabId = await getActiveTabId();
    }

    if (!tabId) return `${ANSI.red}[ERROR] Could not resolve tab. Use tab=<#> to specify.${ANSI.reset}`;

    const result = await applyUAToTab(tabId, agent.ua, agent.label);
    if (result.startsWith("\n\x1b")) setEmulation("ua", agent.label);
    return result;
}
