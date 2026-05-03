/**
 * @module modules/commands/util/geo-menu.js
 * @description Interactive UI menu for geolocation spoofing.
 */

import { ANSI } from "../../formatter.js";
import { getCustomLocations, PRESETS } from "./geo-data.js";
import { listTabOptions } from "./core/ua-engine.js";

/**
 * Builds the interactive geo menu watcher object.
 * We pass the cmdGeo function explicitly to avoid circular import issues.
 */
export function buildGeoMenu(cmdGeo) {
    return {
        __watch: true,
        watcher: {
            onDataDisposable: null,
            start: function(term, doneCallback) {
                const draw = async () => {
                    const customLocs = await getCustomLocations();
                    const { lines } = await listTabOptions();
                    
                    term.write('\x1b[2J\x1b[H');
                    let out = `\n  ${ANSI.bold}${ANSI.cyan}/// GEOLOCATION SPOOFER ///${ANSI.reset}\n\n`;
                    
                    let idx = 1;
                    const keys = [];
                    
                    out += `    ${ANSI.bold}Presets${ANSI.reset}\n`;
                    for (const [key, p] of Object.entries(PRESETS)) {
                        keys.push(key);
                        out += `    ${ANSI.bold}[${idx++}]${ANSI.reset} 📍 ${p.label.padEnd(18)} ${ANSI.dim}(${p.lat}, ${p.lng})${ANSI.reset}\n`;
                    }
                    
                    if (Object.keys(customLocs).length > 0) {
                        out += `\n    ${ANSI.bold}Custom Locations${ANSI.reset}\n`;
                        for (const [key, p] of Object.entries(customLocs)) {
                            keys.push(key);
                            const keyLabel = idx === 10 ? '0' : (idx < 10 ? String(idx) : '-');
                            out += `    ${ANSI.bold}[${keyLabel}]${ANSI.reset} 📌 ${(p.label || key).padEnd(18)} ${ANSI.dim}(${p.lat}, ${p.lng})${ANSI.reset}\n`;
                            idx++;
                        }
                    }
                    
                    out += `\n    ${ANSI.bold}[R]${ANSI.reset} Reset/Clear Spoofing\n`;
                    out += `    ${ANSI.bold}[A]${ANSI.reset} Add Custom Location\n`;
                    out += `    ${ANSI.bold}[D]${ANSI.reset} Delete Custom Location\n`;
                    
                    out += `\n  ${ANSI.dim}Active Tabs:${ANSI.reset}\n`;
                    out += `  ${lines.join("\n  ")}\n`;
                    
                    out += `\n  ${ANSI.dim}Press 1-9 to apply to active tab. 'Q' to quit.${ANSI.reset}\n`;
                    
                    this._keys = keys;
                    term.write(out);
                };

                this.onDataDisposable = term.onData(async e => {
                    const lower = e.toLowerCase();
                    if (lower === 'q' || e === '\x03' || e === '\r' || e === '\n') {
                        doneCallback();
                        return;
                    }
                    
                    if (lower === 'r') {
                        const res = await cmdGeo(["reset"]);
                        term.write(`\n\n  ${res}\n`);
                        setTimeout(() => doneCallback(), 1500);
                        return;
                    }
                    
                    if (lower === 'a') {
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                        const res = await cmdGeo(["add"]);
                        term.write(`\n\n  ${res}\n`);
                        setTimeout(() => this.start(term, doneCallback), 2000);
                        return;
                    }

                    if (lower === 'd') {
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                        const { showModal } = await import("../../terminal/modal.js");
                        const values = await showModal({
                            title: "🗑️ Delete Custom Location",
                            fields: [{ id: "name", label: "Location Name to delete", placeholder: "e.g., office" }]
                        });
                        if (values && values.name) {
                            const res = await cmdGeo(["remove", values.name]);
                            term.write(`\n\n  ${res}\n`);
                            setTimeout(() => this.start(term, doneCallback), 1500);
                        } else {
                            this.start(term, doneCallback);
                        }
                        return;
                    }

                    let targetIdx = -1;
                    if (lower >= '1' && lower <= '9') targetIdx = parseInt(lower) - 1;
                    else if (lower === '0') targetIdx = 9;

                    if (targetIdx >= 0 && targetIdx < this._keys.length) {
                        const selectedKey = this._keys[targetIdx];
                        const res = await cmdGeo([selectedKey]);
                        term.write(`\n\n  ${res}\n`);
                        setTimeout(() => doneCallback(), 1500);
                    }
                });

                draw();
            },
            stop: function(term) {
                if (this.onDataDisposable) {
                    this.onDataDisposable.dispose();
                    this.onDataDisposable = null;
                }
            }
        }
    };
}
