/**
 * @module modules/commands/util/config.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 * - Exports: cmdConfig, getConfig
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { applyTheme } from "../../terminal/theme-engine.js";
import { CONFIG_SCHEMA, loadConfig, saveConfig, resolveValue, validateAndParse } from "./config-schema.js";
import { startInteractiveConfig } from "./config-interactive.js";

// ===================================================================
//  config — User preferences via chrome.storage.local
//
//  Syntax:
//    config                    → Show all current settings
//    config <key>              → Show value for a specific key
//    config <key> <value>      → Set a key-value pair
//    config reset              → Reset all settings to defaults
// ===================================================================

export async function cmdConfig(args) {
    // config reset — restore defaults (with confirmation)
    if (args[0] === "reset") {
        const { showConfirm } = await import("../../terminal/modal.js");
        const confirmed = await showConfirm({
            title: "⚙️ Reset Configuration",
            message: `This will restore <strong style="color:#ffd740">all settings</strong> to their default values.<br><br><span style="color:#888">Timeout, theme, auto-hide, and all other preferences will be reset.</span>`,
            confirmLabel: "Reset All",
            cancelLabel: "Cancel",
            danger: true,
        });
        if (!confirmed) return `${ANSI.dim}Reset cancelled.${ANSI.reset}`;
        await saveConfig({});
        return `${ANSI.green}✓ All settings reset to defaults.${ANSI.reset}`;
    }

    const stored = await loadConfig();

    // config (no args) or config list — show all settings
    if (args.length === 0 || args[0] === "list") {
        if (args.length === 0) {
            // Interactive Mode
            return startInteractiveConfig(stored);
        }

        // List Mode
        let out = `\n${ANSI.white}${ANSI.bold}  Configuration${ANSI.reset}\n`;
        out += `  ${ANSI.dim}${"━".repeat(28)}${ANSI.reset}\n`;

        for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
            const val = resolveValue(key, stored);
            const isCustom = stored[key] !== undefined;
            const valColor = isCustom ? ANSI.yellow : ANSI.green;
            const tag = isCustom ? ` ${ANSI.dim}[custom]${ANSI.reset}` : "";
            const unit = schema.unit || "";
            out += `  ${ANSI.cyan}${key}${ANSI.reset}`;
            out += " ".repeat(Math.max(1, 18 - key.length));
            out += `${valColor}${val}${unit}${ANSI.reset}${tag}\n`;
            out += `  ${" ".repeat(18)}${ANSI.dim}${schema.desc}${ANSI.reset}\n`;
        }

        out += `\n${ANSI.dim}  Usage: config <key> <value>${ANSI.reset}\n`;
        out += `${ANSI.dim}  Reset: config reset${ANSI.reset}\n`;
        return out;
    }

    const inputKey = args[0].toLowerCase();
    const key = Object.keys(CONFIG_SCHEMA).find(k => k.toLowerCase() === inputKey);

    // config <key> — show single value
    if (args.length === 1) {
        if (!key) {
            const available = Object.keys(CONFIG_SCHEMA).join(", ");
            return `${ANSI.red}Unknown key: '${args[0]}'${ANSI.reset}\n${ANSI.dim}Available: ${available}${ANSI.reset}`;
        }
        const val = resolveValue(key, stored);
        const isCustom = stored[key] !== undefined;
        const valColor = isCustom ? ANSI.yellow : ANSI.green;
        const tag = isCustom ? ` ${ANSI.dim}[custom]${ANSI.reset}` : "";
        const schema = CONFIG_SCHEMA[key];
        const unit = schema.unit || "";
        return `${ANSI.cyan}${key}${ANSI.reset} = ${valColor}${val}${unit}${ANSI.reset}${tag} ${ANSI.dim}(${schema.desc})${ANSI.reset}`;
    }

    // config <key> <value> — set value
    if (!key) {
        const available = Object.keys(CONFIG_SCHEMA).join(", ");
        return `${ANSI.red}Unknown key: '${args[0]}'${ANSI.reset}\n${ANSI.dim}Available: ${available}${ANSI.reset}`;
    }

    const rawValue = args.slice(1).join(" ");
    const result = validateAndParse(key, rawValue);

    if (result.error) {
        return `${ANSI.red}[VALIDATION] ${result.error}${ANSI.reset}`;
    }

    stored[key] = result.value;
    await saveConfig(stored);

    // Side-effect: apply theme immediately when changed
    if (key === "theme") {
        applyTheme(result.value);
    }

    const schema = CONFIG_SCHEMA[key];
    const unit = schema.unit || "";
    return `${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${key}${ANSI.reset} set to ${ANSI.yellow}${result.value}${unit}${ANSI.reset}`;
}

// ---------------------------------------------------------------------------
// Config Reader — used by other modules to read settings at runtime
// ---------------------------------------------------------------------------

export async function getConfig(key) {
    const stored = await loadConfig();
    return resolveValue(key, stored);
}
