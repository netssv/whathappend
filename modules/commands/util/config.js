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
            return {
                __watch: true,
                watcher: {
                    onDataDisposable: null,
                    start: function(term, doneCallback) {
                        const keys = Object.keys(CONFIG_SCHEMA);
                        const draw = () => {
                            term.write('\x1b[2J\x1b[H');
                            let out = `\n  ${ANSI.bold}${ANSI.cyan}/// CONFIGURATION ///${ANSI.reset}\n\n`;
                            
                            for (let i = 0; i < keys.length; i++) {
                                const key = keys[i];
                                const schema = CONFIG_SCHEMA[key];
                                const val = resolveValue(key, stored);
                                const color = stored[key] !== undefined ? ANSI.yellow : ANSI.green;
                                
                                let displayVal = val;
                                if (schema.type === 'boolean') {
                                    displayVal = val ? 'ON' : 'OFF';
                                } else {
                                    displayVal = `${val}${schema.unit || ''}`;
                                }
                                
                                out += `    ${ANSI.bold}[${i + 1}]${ANSI.reset} ${key}: ${color}${displayVal}${ANSI.reset}\n`;
                            }
                            
                            out += `\n  ${ANSI.dim}Press number to toggle/edit. 'R' to reset. 'Q' to quit.${ANSI.reset}\n`;
                            term.write(out);
                        };

                        this.onDataDisposable = term.onData(async e => {
                            e = e.toLowerCase();
                            if (e === 'q' || e === '\x03' || e === '\r' || e === '\n') {
                                doneCallback();
                                return;
                            }
                            if (e === 'r') {
                                const { showConfirm } = await import("../../terminal/modal.js");
                                const ok = await showConfirm({ 
                                    title: "⚙️ Reset Configuration", 
                                    message: "Restore all settings to their default values?", 
                                    confirmLabel: "Reset", 
                                    danger: true 
                                });
                                if (ok) {
                                    for(const k of keys) delete stored[k];
                                    await saveConfig({});
                                    draw();
                                }
                                return;
                            }
                            
                            const num = parseInt(e);
                            if (num >= 1 && num <= keys.length) {
                                const key = keys[num - 1];
                                const schema = CONFIG_SCHEMA[key];
                                let val = resolveValue(key, stored);
                                
                                if (schema.type === 'boolean') {
                                    stored[key] = !val;
                                    await saveConfig(stored);
                                    draw();
                                } else if (schema.type === 'enum') {
                                    const idx = schema.options.indexOf(val);
                                    const nextIdx = (idx + 1) % schema.options.length;
                                    stored[key] = schema.options[nextIdx];
                                    await saveConfig(stored);
                                    if (key === "theme") {
                                        applyTheme(stored[key]);
                                    }
                                    draw();
                                } else if (schema.type === 'number') {
                                    this.onDataDisposable.dispose();
                                    this.onDataDisposable = null;
                                    
                                    const { showModal } = await import("../../terminal/modal.js");
                                    const res = await showModal({
                                        title: `Edit ${key}`,
                                        fields: [{ id: "val", label: schema.desc, type: "number", value: val }]
                                    });
                                    
                                    if (res && res.val) {
                                        const parsed = validateAndParse(key, res.val);
                                        if (!parsed.error) {
                                            stored[key] = parsed.value;
                                            await saveConfig(stored);
                                        }
                                    }
                                    
                                    this.start(term, doneCallback);
                                }
                            }
                        });

                        draw();
                    },
                    stop: function(term) {
                        if (this.onDataDisposable) {
                            this.onDataDisposable.dispose();
                            this.onDataDisposable = null;
                        }
                        if (term) term.write(`\n\n  ${ANSI.dim}[Config exited]${ANSI.reset}\n`);
                    }
                }
            };
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
