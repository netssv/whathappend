/**
 * @module modules/commands/util/geo-core.js
 * @description Core chrome.debugger logic for applying geolocation overrides.
 */

import { ANSI } from "../../formatter.js";
import { setEmulation, clearEmulation } from "../../terminal/header/header-emulation.js";

async function attachDebugger(tabId) {
    try {
        await chrome.debugger.attach({ tabId }, "1.3");
    } catch (err) {
        if (!err.message?.includes("already attached")) throw err;
    }
}

export async function applyGeo(tabId, lat, lng, label) {
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

export async function resetGeo(tabId) {
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
