/**
 * @module modules/commands/util/geo.js
 * @description Geolocation spoofing via chrome.debugger + Emulation.setGeolocationOverride.
 *
 * Usage:
 *   geo                        → show presets, custom locations & active tabs
 *   geo [preset]               → set predefined coordinates
 *   geo [lat] [lng]            → set custom coordinates
 *   geo add <name> <lat> <lng> → save a custom named location
 *   geo remove <name>          → delete a saved custom location
 *   geo list                   → show all saved custom locations
 *   geo reset                  → restore original geolocation
 *   geo <preset> tab=<n>       → apply to a specific tab index
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            getActiveTabId, listTabOptions from './core/ua-engine.js'
 * - Exports: cmdGeo, getCustomLocations
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { getActiveTabId, listTabOptions } from "./core/ua-engine.js";
import { PRESETS, getCustomLocations, saveCustomLocations } from "./geo-data.js";
import { applyGeo, resetGeo } from "./geo-core.js";
import { buildGeoMenu } from "./geo-menu.js";

// Re-export for compatibility if anything else imports it from here
export { getCustomLocations };

// ---------------------------------------------------------------------------
// Command entry point
// ---------------------------------------------------------------------------

export async function cmdGeo(args) {
    const sub = args[0]?.toLowerCase();
    const customLocs = await getCustomLocations();

    // ── ADD CUSTOM LOCATION ───────────────────────────────────────────
    if (sub === "add" || sub === "save") {
        let name = args[1]?.toLowerCase();
        let lat = parseFloat(args[2]);
        let lng = parseFloat(args[3]);

        if (!name || isNaN(lat) || isNaN(lng)) {
            const { showModal } = await import("../../terminal/modal.js");
            const values = await showModal({
                title: "📍 Add Custom Location",
                fields: [
                    { id: "name", label: "Location Name", placeholder: "e.g., office", value: name || "" },
                    { id: "lat", label: "Latitude", type: "number", step: "any", placeholder: "-90 to 90", row: 1, value: isNaN(lat) ? "" : lat },
                    { id: "lng", label: "Longitude", type: "number", step: "any", placeholder: "-180 to 180", row: 1, value: isNaN(lng) ? "" : lng }
                ],
                submitLabel: "Save",
                validate: (v) => {
                    if (!v.name) return "Name is required.";
                    const flat = parseFloat(v.lat);
                    const flng = parseFloat(v.lng);
                    if (isNaN(flat) || isNaN(flng)) return "Valid coordinates required.";
                    if (flat < -90 || flat > 90 || flng < -180 || flng > 180) return "Latitude must be -90..90 and longitude -180..180.";
                    if (PRESETS[v.name.toLowerCase()]) return `'${v.name}' is a built-in preset.`;
                    return null;
                }
            });

            if (!values) return `${ANSI.dim}Cancelled.${ANSI.reset}`;
            name = values.name.toLowerCase();
            lat = parseFloat(values.lat);
            lng = parseFloat(values.lng);
            
            // We need to store original casing for label
            args[1] = values.name; 
        }

        if (PRESETS[name]) {
            return `${ANSI.red}[ERROR] '${name}' is a built-in preset and cannot be overwritten.${ANSI.reset}`;
        }
        if (isNaN(lat) || isNaN(lng)) {
            return `${ANSI.red}[ERROR] Invalid coordinates.${ANSI.reset}\n  ${ANSI.dim}Usage: geo add ${name} <lat> <lng>${ANSI.reset}\n  ${ANSI.dim}Example: geo add office 13.68 -89.23${ANSI.reset}`;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return `${ANSI.red}[ERROR] Latitude must be -90..90 and longitude -180..180.${ANSI.reset}`;
        }

        customLocs[name] = { lat, lng, label: args[1] || name }; // preserve original casing for label
        await saveCustomLocations(customLocs);

        return `${ANSI.green}✓${ANSI.reset} Location ${ANSI.cyan}${name}${ANSI.reset} saved  ${ANSI.dim}(${lat}, ${lng})${ANSI.reset}\n  ${ANSI.dim}Use: ${ANSI.white}geo ${name}${ANSI.reset}`;
    }

    // ── REMOVE CUSTOM LOCATION ────────────────────────────────────────
    if (sub === "remove" || sub === "delete" || sub === "rm") {
        const name = args[1]?.toLowerCase();
        if (!name) {
            return `${ANSI.red}[ERROR] Missing name.${ANSI.reset}\n  ${ANSI.dim}Usage: geo remove <name>${ANSI.reset}`;
        }
        if (!customLocs[name]) {
            return `${ANSI.red}[ERROR] '${name}' not found in custom locations.${ANSI.reset}`;
        }

        const { showConfirm } = await import("../../terminal/modal.js");
        const confirmed = await showConfirm({
            title: "🗑️ Remove Location",
            message: `Delete saved location <strong style="color:#fff">${name}</strong>?<br><span style="color:#888">(${customLocs[name].lat}, ${customLocs[name].lng})</span>`,
            confirmLabel: "Delete",
            cancelLabel: "Keep",
            danger: true,
        });

        if (!confirmed) {
            return `${ANSI.dim}Cancelled.${ANSI.reset}`;
        }

        delete customLocs[name];
        await saveCustomLocations(customLocs);
        return `${ANSI.green}✓${ANSI.reset} Location ${ANSI.cyan}${name}${ANSI.reset} removed.`;
    }

    // ── INTERACTIVE MENU ──────────────────────────────────────────────
    if (!sub) {
        return buildGeoMenu(cmdGeo);
    }

    // ── LIST ──────────────────────────────────────────────────────────
    if (sub === "list") {
        const { lines } = await listTabOptions();
        const hasCustom = Object.keys(customLocs).length > 0;

        let o = `\n${ANSI.cyan}${ANSI.bold}  Geolocation Spoofer${ANSI.reset}\n`;
        o += `${ANSI.dim}  Overrides navigator.geolocation via debugger protocol.${ANSI.reset}\n\n`;

        o += `${ANSI.bold}  Presets${ANSI.reset}\n`;
        for (const [key, p] of Object.entries(PRESETS)) {
            o += `  ${ANSI.dim}${key.padEnd(14)}${ANSI.reset} 📍 ${p.label.padEnd(18)} ${ANSI.dim}(${p.lat}, ${p.lng})${ANSI.reset}\n`;
        }

        if (hasCustom) {
            o += `\n${ANSI.bold}  Custom Locations${ANSI.reset}\n`;
            for (const [key, p] of Object.entries(customLocs)) {
                o += `  ${ANSI.yellow}${key.padEnd(14)}${ANSI.reset} 📌 ${(p.label || key).padEnd(18)} ${ANSI.dim}(${p.lat}, ${p.lng})${ANSI.reset}\n`;
            }
        }

        o += `\n${ANSI.dim}Usage: ${ANSI.white}geo tokyo${ANSI.dim}                  · active tab\n`;
        o += `       ${ANSI.white}geo 48.85 2.35${ANSI.dim}              · custom lat/lng\n`;
        o += `       ${ANSI.white}geo add office 13.68 -89.23${ANSI.dim} · save location\n`;
        o += `       ${ANSI.white}geo remove office${ANSI.dim}           · delete saved\n`;
        o += `       ${ANSI.white}geo london tab=3${ANSI.dim}            · specific tab\n`;
        o += `       ${ANSI.white}geo reset${ANSI.dim}                   · restore default${ANSI.reset}`;
        return o;
    }

    // ── RESET ─────────────────────────────────────────────────────────
    if (sub === "reset" || sub === "off" || sub === "clear") {
        const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
        const tabId = tabArg
            ? (await listTabOptions()).indexMap[parseInt(tabArg, 10)]
            : await getActiveTabId();
        if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;
        return await resetGeo(tabId);
    }

    // ── APPLY PRESET, CUSTOM, OR RAW COORDS ──────────────────────────
    let lat, lng, label;

    if (PRESETS[sub]) {
        lat = PRESETS[sub].lat;
        lng = PRESETS[sub].lng;
        label = PRESETS[sub].label;
    } else if (customLocs[sub]) {
        lat = customLocs[sub].lat;
        lng = customLocs[sub].lng;
        label = customLocs[sub].label || sub;
    } else if (args.length >= 2 && !isNaN(parseFloat(args[0])) && !isNaN(parseFloat(args[1]))) {
        lat = parseFloat(args[0]);
        lng = parseFloat(args[1]);
        label = "Custom Coordinates";
    } else {
        const builtIn = Object.keys(PRESETS).join(", ");
        const custom = Object.keys(customLocs);
        let msg = `${ANSI.red}[ERROR] Unknown preset or invalid coordinates.${ANSI.reset}\n  ${ANSI.dim}Built-in: ${builtIn}, reset${ANSI.reset}`;
        if (custom.length) {
            msg += `\n  ${ANSI.dim}Custom:   ${custom.join(", ")}${ANSI.reset}`;
        }
        msg += `\n  ${ANSI.dim}Or add one: geo add <name> <lat> <lng>${ANSI.reset}`;
        return msg;
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
