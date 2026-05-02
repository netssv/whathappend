/**
 * @module modules/commands/util/geo.js
 * @description Geolocation spoofing via chrome.debugger + Emulation.setGeolocationOverride.
 *
 * Usage:
 *   geo                   → show presets + active tabs
 *   geo [lat] [lng]       → set custom coordinates
 *   geo [preset]          → set predefined coordinates
 *   geo reset             → restore original geolocation
 *   geo <preset> tab=<n>  → apply to a specific tab index
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            getActiveTabId, listTabOptions from './core/ua-engine.js'
 * - Exports: cmdGeo
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { getActiveTabId, listTabOptions } from "./core/ua-engine.js";
import { setEmulation, clearEmulation } from "../../terminal/header/header-emulation.js";

// ---------------------------------------------------------------------------
// Geolocation Presets
// ---------------------------------------------------------------------------

const PRESETS = {
    london:      { lat: 51.5074,  lng: -0.1278,   label: "London, UK" },
    nyc:         { lat: 40.7128,  lng: -74.0060,  label: "New York, USA" },
    india:       { lat: 20.5937,  lng: 78.9629,   label: "India" },
    tokyo:       { lat: 35.6762,  lng: 139.6503,  label: "Tokyo, Japan" },
    mexico:      { lat: 23.6345,  lng: -102.5528, label: "Mexico" },
    brazil:      { lat: -14.2350, lng: -51.9253,  label: "Brazil" },
    italy:       { lat: 41.8719,  lng: 12.5674,   label: "Italy" },
    philippines: { lat: 12.8797,  lng: 121.7740,  label: "Philippines" },
};

// ---------------------------------------------------------------------------
// Debugger helpers
// ---------------------------------------------------------------------------

async function attachDebugger(tabId) {
    try {
        await chrome.debugger.attach({ tabId }, "1.3");
    } catch (err) {
        if (!err.message?.includes("already attached")) throw err;
    }
}

async function applyGeo(tabId, lat, lng, label) {
    await attachDebugger(tabId);

    // Emulation.setGeolocationOverride requires accuracy (e.g. 100 meters)
    await chrome.debugger.sendCommand({ tabId }, "Emulation.setGeolocationOverride", {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        accuracy: 100
    });

    // Optionally reload the tab to ensure scripts pick up the new location
    await chrome.tabs.reload(tabId, { bypassCache: true });

    const tab = await chrome.tabs.get(tabId);
    let host = "";
    try { host = new URL(tab.url).hostname; } catch { host = tab.url; }

    let o = `\n${ANSI.green}[OK]${ANSI.reset} Geolocation spoofing active\n`;
    o += `  ${ANSI.dim}Tab     ${ANSI.reset}${host}\n`;
    o += `  ${ANSI.dim}Location${ANSI.reset} ${ANSI.cyan}${label}${ANSI.reset}  ${ANSI.dim}(${lat}, ${lng})${ANSI.reset}\n`;
    o += `\n${ANSI.dim}The page has been reloaded. Note that geolocation persists until the tab is closed or you run ${ANSI.white}geo reset${ANSI.dim}.${ANSI.reset}\n`;
    o += `${ANSI.dim}Verify: ${ANSI.white}https://browserleaks.com/geo${ANSI.reset}`;

    setEmulation("geo", label);
    return o;
}

async function resetGeo(tabId) {
    try {
        await attachDebugger(tabId);
        await chrome.debugger.sendCommand({ tabId }, "Emulation.clearGeolocationOverride", {});
        await chrome.debugger.detach({ tabId });

        await chrome.tabs.reload(tabId, { bypassCache: true });
        clearEmulation("geo");
        return `${ANSI.green}[OK]${ANSI.reset} Geolocation restored. Tab reloaded.`;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}

// ---------------------------------------------------------------------------
// Command entry point
// ---------------------------------------------------------------------------

export async function cmdGeo(args) {
    const sub = args[0]?.toLowerCase();

    // ── LIST ───────────────────────────────────────────────────────────
    if (!sub) {
        const { lines } = await listTabOptions();

        let o = `\n${ANSI.cyan}${ANSI.bold}  Geolocation Spoofer${ANSI.reset}\n`;
        o += `${ANSI.dim}  Overrides navigator.geolocation via debugger protocol.${ANSI.reset}\n\n`;

        o += `${ANSI.bold}  Presets${ANSI.reset}\n`;
        for (const [key, p] of Object.entries(PRESETS)) {
            o += `  ${ANSI.dim}${key.padEnd(12)}${ANSI.reset} 📍 ${p.label.padEnd(18)} ${ANSI.dim}(${p.lat}, ${p.lng})${ANSI.reset}\n`;
        }

        o += `\n${ANSI.bold}  Active Tabs${ANSI.reset}\n`;
        o += lines.join("\n") + "\n";

        o += `\n${ANSI.dim}Usage: ${ANSI.white}geo tokyo${ANSI.dim}                · active tab\n`;
        o += `       ${ANSI.white}geo 48.85 2.35${ANSI.dim}             · custom lat/lng\n`;
        o += `       ${ANSI.white}geo london tab=3${ANSI.dim}           · specific tab\n`;
        o += `       ${ANSI.white}geo reset${ANSI.dim}                  · restore default${ANSI.reset}`;
        return o;
    }

    // ── RESET ──────────────────────────────────────────────────────────
    if (sub === "reset" || sub === "off" || sub === "clear") {
        const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
        const tabId = tabArg
            ? (await listTabOptions()).indexMap[parseInt(tabArg, 10)]
            : await getActiveTabId();
        if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;
        return await resetGeo(tabId);
    }

    // ── APPLY PRESET OR CUSTOM ─────────────────────────────────────────
    let lat, lng, label;

    if (PRESETS[sub]) {
        lat = PRESETS[sub].lat;
        lng = PRESETS[sub].lng;
        label = PRESETS[sub].label;
    } else if (args.length >= 2 && !isNaN(parseFloat(args[0])) && !isNaN(parseFloat(args[1]))) {
        lat = parseFloat(args[0]);
        lng = parseFloat(args[1]);
        label = "Custom Coordinates";
    } else {
        const keys = Object.keys(PRESETS).join(", ");
        return `${ANSI.red}[ERROR] Unknown preset or invalid coordinates.${ANSI.reset}\n  ${ANSI.dim}Available: ${keys}, reset${ANSI.reset}`;
    }

    const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
    let tabId;
    if (tabArg) {
        const { indexMap } = await listTabOptions();
        tabId = indexMap[parseInt(tabArg, 10)] ?? parseInt(tabArg, 10);
    } else {
        tabId = await getActiveTabId();
    }
    if (!tabId) return `${ANSI.red}[ERROR] No active tab found. Use tab=<#> to specify.${ANSI.reset}`;

    try {
        return await applyGeo(tabId, lat, lng, label);
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n${ANSI.dim}Tip: Close DevTools on that tab first.${ANSI.reset}`;
    }
}
