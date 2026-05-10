/**
 * @module modules/terminal/header/header-emulation.js
 * @description Visual feedback for active debugger-based emulations.
 *              Shows compact pills with hover dropdowns in the header.
 *
 * @connections
 * - Imports: InputEvents from '../input/events.js'
 * - Exports: setEmulation, clearEmulation, clearAllEmulations
 * - Layer: Terminal Layer (Header) - Renders emulation state badges.
 */

import { InputEvents } from "../input/events.js";

// ---------------------------------------------------------------------------
// Emulation state (singleton map: type → { label, presets[] })
// ---------------------------------------------------------------------------

const _active = new Map();

const ICONS  = { ua: "🔀", mobile: "📱", throttle: "⏱", geo: "📍", block: "🚫", ipspoof: "🎭" };
const LABELS = { ua: "User Agent", mobile: "Mobile", throttle: "Network", geo: "Location", block: "Blocked URLs", ipspoof: "IP Spoof" };

// Preset maps for each emulation type (populated from data modules lazily)
const PRESETS = {
    ua:       [
        { key: "1", label: "Chrome · Win" },  { key: "2", label: "Chrome · Mac" },
        { key: "3", label: "Firefox · Win" }, { key: "4", label: "Firefox · Mac" },
        { key: "5", label: "Safari · Mac" },  { key: "6", label: "Edge · Win" },
        { key: "7", label: "Googlebot" },     { key: "8", label: "Bingbot" },
    ],
    mobile:   [
        { key: "1", label: "iPhone Safari" },    { key: "2", label: "iPhone Chrome" },
        { key: "3", label: "Galaxy Chrome" },     { key: "4", label: "Pixel Chrome" },
        { key: "5", label: "iPad Safari" },       { key: "6", label: "Googlebot Mobile" },
    ],
    throttle: [
        { key: "5g",     label: "5G / Fiber" },   { key: "4g",     label: "4G LTE" },
        { key: "fast3g", label: "Fast 3G" },       { key: "slow3g", label: "Slow 3G" },
        { key: "edge",   label: "2G / EDGE" },     { key: "offline", label: "Offline" },
    ],
    geo:      [
        { key: "london", label: "London" },       { key: "nyc",    label: "New York" },
        { key: "tokyo",  label: "Tokyo" },        { key: "mexico", label: "Mexico" },
        { key: "brazil", label: "Brazil" },       { key: "india",  label: "India" },
        { key: "italy",  label: "Italy" },        { key: "philippines", label: "Philippines" },
    ],
    block: [
        { key: "*.js", label: "Block *.js" },
        { key: "*.css", label: "Block *.css" },
        { key: "*.png", label: "Block *.png" },
        { key: "*analytics*", label: "Block Analytics" },
    ],
    ipspoof: [
        { key: "1.1.1.1", label: "Cloudflare (1.1.1.1)" },
        { key: "8.8.8.8", label: "Google (8.8.8.8)" },
        { key: "127.0.0.1", label: "Localhost" },
    ],
};

// Maps type → terminal command root
const CMD_MAP = { ua: "ua", mobile: "mobile", throttle: "throttle", geo: "geo", block: "block", ipspoof: "ip-spoof" };

function execCmd(cmd) {
    InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, cmd);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function render() {
    const bar = document.getElementById("emulation-bar");
    if (!bar) return;
    bar.replaceChildren();

    if (_active.size === 0) {
        bar.classList.remove("visible");
        return;
    }

    for (const [type, label] of _active) {
        const pill = document.createElement("div");
        pill.className = "emu-pill";
        pill.dataset.type = type;

        // Pill label
        const pillLabel = document.createElement("span");
        pillLabel.className = "emu-pill-label";
        pillLabel.textContent = `${ICONS[type] || "⚙"} ${label}`;
        pill.appendChild(pillLabel);

        // Arrow indicator
        const arrow = document.createElement("span");
        arrow.className = "emu-pill-arrow";
        arrow.textContent = "▾";
        pill.appendChild(arrow);

        // Dropdown
        const dropdown = document.createElement("div");
        dropdown.className = "emu-dropdown";

        // Header
        const header = document.createElement("div");
        header.className = "emu-dropdown-header";
        header.textContent = LABELS[type] || type;
        dropdown.appendChild(header);

        // Preset options
        const presets = PRESETS[type] || [];
        for (const p of presets) {
            const opt = document.createElement("button");
            opt.className = "emu-dropdown-item";
            if (p.label === label) opt.classList.add("active");
            opt.textContent = p.label;
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                execCmd(`${CMD_MAP[type]} ${p.key}`);
            });
            dropdown.appendChild(opt);
        }

        // Separator + Disable
        const sep = document.createElement("div");
        sep.className = "emu-dropdown-sep";
        dropdown.appendChild(sep);

        const disable = document.createElement("button");
        disable.className = "emu-dropdown-item emu-dropdown-disable";
        disable.textContent = "✕ Disable";
        disable.addEventListener("click", (e) => {
            e.stopPropagation();
            execCmd(`${CMD_MAP[type]} reset`);
        });
        dropdown.appendChild(disable);

        pill.appendChild(dropdown);
        bar.appendChild(pill);
    }

    bar.classList.add("visible");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function setEmulation(type, label) {
    _active.set(type, label);
    render();
}

export function clearEmulation(type) {
    _active.delete(type);
    render();
}

export function clearAllEmulations() {
    _active.clear();
    render();
}
