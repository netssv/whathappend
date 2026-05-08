/**
 * @module modules/commands/util/mobile.js
 * @description Preview a URL in mobile user agent context with auto-reload.
 *              Spoofs a mobile UA via chrome.debugger and reloads the target tab.
 *
 * Usage:
 *   mobile               → list mobile UA presets + active tabs
 *   mobile <n> [tab=<t>] → apply mobile UA #n to tab #t (default: active tab)
 *   mobile reset         → restore original UA
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            MOBILE_AGENTS from '../../data/useragent-data.js'
 *            listTabOptions, applyUAToTab, resetUA, getActiveTabId from './core/ua-engine.js'
 * - Exports: cmdMobile
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { MOBILE_AGENTS } from "../../data/useragent-data.js";
import { listTabOptions, applyUAToTab, resetUA, getActiveTabId } from "./core/ua-engine.js";
import { setEmulation } from "../../terminal/header/header-emulation.js";

export async function cmdMobile(args) {
    const sub = args[0]?.toLowerCase();

    // ── RESET ──────────────────────────────────────────────────────────
    if (sub === "reset" || sub === "off" || sub === "desktop") {
        const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
        const tabId = tabArg ? parseInt(tabArg, 10) : await getActiveTabId();
        if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;
        return await resetUA(tabId);
    }

    // ── LIST ───────────────────────────────────────────────────────────
    const agentIdx = parseInt(sub, 10);
    if (!sub || isNaN(agentIdx)) {
        const { lines } = await listTabOptions();

        let o = `\n${ANSI.cyan}${ANSI.bold}  Mobile Preview${ANSI.reset}\n`;
        o += `${ANSI.dim}  Spoof a mobile User Agent to test responsive behavior.${ANSI.reset}\n\n`;

        o += `${ANSI.bold}  Mobile Agents${ANSI.reset}\n`;
        MOBILE_AGENTS.forEach((a, i) => {
            const icon = a.label.includes("iPhone") || a.label.includes("iPad") ? "🍎" : "🤖";
            o += `  ${ANSI.dim}${String(i + 1).padStart(2)}${ANSI.reset}  ${icon} ${a.label}\n`;
        });

        o += `\n${ANSI.bold}  Active Tabs${ANSI.reset}\n`;
        o += lines.join("\n") + "\n";

        o += `\n${ANSI.dim}Usage: ${ANSI.white}mobile <agent#> [tab=<tab#>]${ANSI.reset}\n`;
        o += `${ANSI.dim}       ${ANSI.white}mobile reset${ANSI.dim}               · restore desktop UA${ANSI.reset}`;
        return o;
    }

    // ── APPLY ──────────────────────────────────────────────────────────
    const agent = MOBILE_AGENTS[agentIdx - 1];
    if (!agent) {
        return `${ANSI.red}[ERROR] Agent #${agentIdx} not found. Run ${ANSI.white}mobile${ANSI.red} to see options.${ANSI.reset}`;
    }

    const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
    let tabId;

    if (tabArg) {
        const { indexMap } = await listTabOptions();
        tabId = indexMap[parseInt(tabArg, 10)] ?? parseInt(tabArg, 10);
    } else {
        tabId = await getActiveTabId();
    }

    if (!tabId) return `${ANSI.red}[ERROR] Could not resolve tab. Use tab=<#> to specify.${ANSI.reset}`;

    const result = await applyUAToTab(tabId, agent.ua, agent.label);
    if (result.startsWith("\n\x1b")) setEmulation("mobile", agent.label);
    return result;
}
