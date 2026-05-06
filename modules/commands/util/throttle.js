/**
 * @module modules/commands/util/throttle.js
 * @description Network throttling via chrome.debugger + Network.emulateNetworkConditions.
 *
 * Usage:
 *   throttle              → show available profiles + active tab info
 *   throttle fast3g       → 560kbps down, 100ms latency
 *   throttle slow3g       → 250kbps down, 400ms latency
 *   throttle offline      → block all network traffic
 *   throttle reset        → disable emulation, restore full speed
 *   throttle <type> tab=<n> → apply to a specific tab index
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 *            getActiveTabId, listTabOptions from './core/ua-engine.js'
 * - Exports: cmdThrottle
 * - Layer: Command Layer (Util)
 */

import { ANSI } from "../../formatter.js";
import { getActiveTabId, listTabOptions } from "./core/ua-engine.js";
import { setEmulation, clearEmulation } from "../../terminal/header/header-emulation.js";
import { ensureDebugger, getDebuggerFallbackMessage } from "./core/debugger-guard.js";

// ---------------------------------------------------------------------------
// Network Profiles
// ---------------------------------------------------------------------------
// Values match Chrome DevTools Network presets.
// downloadThroughput / uploadThroughput are in bytes/s (-1 = unlimited).

const PROFILES = {
    "5g": {
        label:             "5G / Fiber",
        offline:           false,
        latency:           10,
        downloadThroughput: Math.floor(50000 * 1024 / 8),  // 50 Mbps
        uploadThroughput:  Math.floor(20000 * 1024 / 8),   // 20 Mbps
        hint:              "50 Mbps · 10ms RTT",
    },
    "4g": {
        label:             "4G LTE",
        offline:           false,
        latency:           50,
        downloadThroughput: Math.floor(10000 * 1024 / 8),  // 10 Mbps
        uploadThroughput:  Math.floor(5000 * 1024 / 8),    // 5 Mbps
        hint:              "10 Mbps · 50ms RTT",
    },
    fast3g: {
        label:             "Fast 3G",
        offline:           false,
        latency:           100,                   
        downloadThroughput: Math.floor(1500 * 1024 / 8),   // 1.5 Mbps
        uploadThroughput:  Math.floor(750 * 1024 / 8),
        hint:              "1.5 Mbps · 100ms RTT",
    },
    slow3g: {
        label:             "Slow 3G",
        offline:           false,
        latency:           400,                   
        downloadThroughput: Math.floor(400 * 1024 / 8),    // 400 kbps
        uploadThroughput:  Math.floor(400 * 1024 / 8),
        hint:              "400 kbps · 400ms RTT",
    },
    edge: {
        label:             "2G / EDGE",
        offline:           false,
        latency:           800,                   
        downloadThroughput: Math.floor(64 * 1024 / 8),     // 64 kbps
        uploadThroughput:  Math.floor(64 * 1024 / 8),
        hint:              "64 kbps · 800ms RTT",
    },
    offline: {
        label:             "Offline",
        offline:           true,
        latency:           0,
        downloadThroughput: 0,
        uploadThroughput:  0,
        hint:              "No connectivity",
    },
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

async function applyThrottle(tabId, profileKey) {
    const profile = PROFILES[profileKey];
    await attachDebugger(tabId);

    await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
    await chrome.debugger.sendCommand({ tabId }, "Network.emulateNetworkConditions", {
        offline:            profile.offline,
        latency:            profile.latency,
        downloadThroughput: profile.downloadThroughput,
        uploadThroughput:   profile.uploadThroughput,
    });

    const tab = await chrome.tabs.get(tabId);
    let host = "";
    try { host = new URL(tab.url).hostname; } catch { host = tab.url; }

    let o = `\n${ANSI.green}[OK]${ANSI.reset} Network throttling active\n`;
    o += `  ${ANSI.dim}Tab     ${ANSI.reset}${host}\n`;
    o += `  ${ANSI.dim}Profile ${ANSI.reset}${ANSI.cyan}${profile.label}${ANSI.reset}  ${ANSI.dim}${profile.hint}${ANSI.reset}\n`;
    o += `\n${ANSI.dim}Throttle persists until tab is closed or you run ${ANSI.white}throttle reset${ANSI.dim}.${ANSI.reset}\n`;
    o += `${ANSI.dim}Verify: ${ANSI.white}https://www.speedtest.net${ANSI.reset}`;

    setEmulation("throttle", profile.label);
    return o;
}

async function resetThrottle(tabId) {
    try {
        await attachDebugger(tabId);
        await chrome.debugger.sendCommand({ tabId }, "Network.enable", {});
        await chrome.debugger.sendCommand({ tabId }, "Network.emulateNetworkConditions", {
            offline:            false,
            latency:            0,
            downloadThroughput: -1,
            uploadThroughput:   -1,
        });
        await chrome.debugger.detach({ tabId });

        clearEmulation("throttle");
        return `${ANSI.green}[OK]${ANSI.reset} Network throttling disabled. Full speed restored.`;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}

// ---------------------------------------------------------------------------
// Command entry point
// ---------------------------------------------------------------------------

export async function cmdThrottle(args) {
    const sub = args[0]?.toLowerCase();

    // ── Permission guard — request debugger on demand ──────────────────
    if (sub && sub !== "help") {
        const granted = await ensureDebugger();
        if (!granted) {
            const tabId = await getActiveTabId();
            let domain = "";
            if (tabId) {
                try { const tab = await chrome.tabs.get(tabId); domain = new URL(tab.url).hostname; } catch {}
            }
            return getDebuggerFallbackMessage("throttle", domain);
        }
    }

    // ── LIST ───────────────────────────────────────────────────────────
    if (!sub) {
        const { lines } = await listTabOptions();

        let o = `\n${ANSI.cyan}${ANSI.bold}  Network Throttle${ANSI.reset}\n`;
        o += `${ANSI.dim}  Emulates slow network conditions via debugger protocol.${ANSI.reset}\n\n`;

        o += `${ANSI.bold}  Profiles${ANSI.reset}\n`;
        for (const [key, p] of Object.entries(PROFILES)) {
            const icon = key === "offline" ? "✗" : "≈";
            o += `  ${ANSI.dim}${key.padEnd(10)}${ANSI.reset}${icon} ${p.label.padEnd(12)} ${ANSI.dim}${p.hint}${ANSI.reset}\n`;
        }

        o += `\n${ANSI.bold}  Active Tabs${ANSI.reset}\n`;
        o += lines.join("\n") + "\n";

        o += `\n${ANSI.dim}Note: Emulation strictly applies per-tab to isolate tests from the rest of the browser.${ANSI.reset}\n\n`;
        o += `${ANSI.dim}Usage: ${ANSI.white}throttle 4g${ANSI.dim}                · active tab\n`;
        o += `       ${ANSI.white}throttle slow3g tab=3${ANSI.dim}      · specific tab\n`;
        o += `       ${ANSI.white}throttle reset${ANSI.dim}              · disable emulation${ANSI.reset}`;
        return o;
    }

    // ── RESET ──────────────────────────────────────────────────────────
    if (sub === "reset" || sub === "off" || sub === "none" || sub === "disable") {
        const tabArg = args.find(a => a.startsWith("tab="))?.split("=")[1];
        const tabId = tabArg
            ? (await listTabOptions()).indexMap[parseInt(tabArg, 10)]
            : await getActiveTabId();
        if (!tabId) return `${ANSI.red}[ERROR] No active tab found.${ANSI.reset}`;
        return await resetThrottle(tabId);
    }

    // ── APPLY PROFILE ──────────────────────────────────────────────────
    if (!PROFILES[sub]) {
        const keys = Object.keys(PROFILES).join(", ");
        return `${ANSI.red}[ERROR] Unknown profile "${sub}".${ANSI.reset}\n  ${ANSI.dim}Available: ${keys}, reset${ANSI.reset}`;
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
        return await applyThrottle(tabId, sub);
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}\n${ANSI.dim}Tip: Close DevTools on that tab first.${ANSI.reset}`;
    }
}
