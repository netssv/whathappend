/**
 * @module modules/commands/util/tabs-block.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 * - Exports: tabBlock
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";

// ===================================================================
//  tabs-block — Toggle content settings (JS, images, popups)
//
//  Usage:
//    tabs block <#> js        — Block/unblock JavaScript
//    tabs block <#> images    — Block/unblock images
//    tabs block <#> popups    — Block/unblock popups
//    tabs block <#> all       — Block everything
//    tabs block <#> none      — Unblock everything
//    tabs block <#>           — Show current state
// ===================================================================

const TYPES = {
    js:     { api: "javascript",  label: "JavaScript" },
    images: { api: "images",      label: "Images" },
    popups: { api: "popups",      label: "Popups" },
};

async function getState(pattern) {
    const state = {};
    for (const [key, { api }] of Object.entries(TYPES)) {
        try {
            const result = await chrome.contentSettings[api].get({ primaryUrl: pattern });
            state[key] = result.setting; // "allow" or "block"
        } catch { state[key] = "unknown"; }
    }
    return state;
}

async function setOne(api, pattern, setting) {
    await chrome.contentSettings[api].set({
        primaryPattern: pattern,
        setting, // "allow" or "block"
    });
}

export async function tabBlock(tabId, label, args) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url?.startsWith("http")) {
            return `${ANSI.red}[ERROR] Only works on HTTP/HTTPS pages.${ANSI.reset}`;
        }

        let host = "";
        try { host = new URL(tab.url).hostname; } catch { return `${ANSI.red}[ERROR] Invalid URL.${ANSI.reset}`; }

        const pattern = `*://${host}/*`;
        const target = args[0]?.toLowerCase();

        // ── Show current state ──────────────────────────────────
        if (!target) {
            const state = await getState(tab.url);
            const sep = `${ANSI.dim}${"━".repeat(30)}${ANSI.reset}`;
            let o = `\n${ANSI.cyan}${ANSI.bold}  Content #${label}${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n  ${sep}\n`;

            for (const [key, { label: lbl }] of Object.entries(TYPES)) {
                const s = state[key];
                const icon = s === "allow" ? `${ANSI.green}✓${ANSI.reset}` : `${ANSI.red}✗${ANSI.reset}`;
                o += `  ${icon} ${ANSI.white}${lbl}${ANSI.reset}  ${ANSI.dim}${s}${ANSI.reset}\n`;
            }

            o += `\n${ANSI.dim}  tabs block ${label} js|images|popups${ANSI.reset}`;
            o += `\n${ANSI.dim}  tabs block ${label} all|none${ANSI.reset}\n`;
            return o;
        }

        // ── Block/Unblock All ───────────────────────────────────
        if (target === "all" || target === "none") {
            const setting = target === "all" ? "block" : "allow";
            for (const { api } of Object.values(TYPES)) {
                await setOne(api, pattern, setting);
            }
            const verb = target === "all" ? `${ANSI.red}Blocked${ANSI.reset}` : `${ANSI.green}Allowed${ANSI.reset}`;
            return `${ANSI.green}[OK]${ANSI.reset} ${verb} all content on ${ANSI.cyan}${host}${ANSI.reset}\n${ANSI.dim}Reload the tab to apply.${ANSI.reset}`;
        }

        // ── Toggle single type ──────────────────────────────────
        const type = TYPES[target];
        if (!type) {
            return `${ANSI.red}[ERROR] Unknown: '${target}'. Use: js, images, popups, all, none${ANSI.reset}`;
        }

        const current = await getState(tab.url);
        const newSetting = current[target] === "block" ? "allow" : "block";
        await setOne(type.api, pattern, newSetting);

        const icon = newSetting === "allow" ? `${ANSI.green}✓ Allowed${ANSI.reset}` : `${ANSI.red}✗ Blocked${ANSI.reset}`;
        return `${icon} ${type.label} on ${ANSI.cyan}${host}${ANSI.reset}\n${ANSI.dim}Reload the tab to apply.${ANSI.reset}`;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
