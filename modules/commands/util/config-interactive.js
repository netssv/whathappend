/**
 * @module modules/commands/util/config-interactive.js
 * @description Interactive configuration menu for the terminal.
 */

import { ANSI } from "../../formatter.js";
import { applyTheme } from "../../terminal/theme-engine.js";
import { CONFIG_SCHEMA, saveConfig, resolveValue, validateAndParse } from "./config-schema.js";

export function startInteractiveConfig(stored) {
    return {
        __watch: true,
        watcher: {
            clearOnExit: true,
            onDataDisposable: null,
            start: function(term, doneCallback) {
                const keys = Object.keys(CONFIG_SCHEMA);
                const draw = () => {
                    term.write('\x1b[2J\x1b[3J\x1b[H');
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
                        term.clear();
                        import("../../terminal-ui.js").then(ui => ui.showBanner());
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
