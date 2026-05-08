/**
 * @module modules/commands/util/about.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - getHistory from '../../state.js'
 *     - getCurrentTheme from '../../terminal/theme-engine.js'
 *     - THEMES from '../../data/themes.js'
 * - Exports: cmdAbout
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { getHistory } from "../../state.js";
import { getCurrentTheme } from "../../terminal/theme-engine.js";
import { THEMES } from "../../data/themes.js";

// ===================================================================
//  about — Neofetch-style system summary
// ===================================================================

// Session start timestamp (set when module first loads)
const SESSION_START = Date.now();

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);

    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export async function cmdAbout() {
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;
    const uptime = formatUptime(Date.now() - SESSION_START);
    const sessionCmds = getHistory().length;

    // Public IP (fast, non-blocking)
    let publicIp = "Offline";
    try {
        const ipResp = await fetch("https://1.1.1.1/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
        const text = await ipResp.text();
        const match = text.match(/ip=([^\n]+)/);
        if (match) publicIp = match[1];
    } catch (_) {}

    // Theme
    const themeId = getCurrentTheme();
    const themeName = THEMES[themeId]?.name || themeId;

    // Open tabs
    let tabCount = "?";
    try {
        const tabs = await chrome.tabs.query({});
        tabCount = tabs.length;
    } catch (_) {}

    // Memory
    let memInfo = "N/A";
    if (performance?.memory) {
        memInfo = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + " MB";
    }

    // Storage
    let storageInfo = "N/A";
    try {
        const bytes = await chrome.storage.local.getBytesInUse(null);
        storageInfo = (bytes / 1024).toFixed(1) + " KB";
    } catch (_) {}

    // Browser
    const uaMatch = navigator.userAgent.match(/(Chrome|Chromium|Brave|Edge|OPR|Vivaldi)\/([0-9.]+)/);
    const browser = uaMatch ? `${uaMatch[1] === "OPR" ? "Opera" : uaMatch[1]} ${uaMatch[2]}` : "Chromium";

    const os = navigator.platform || "Unknown";

    // ── Build neofetch layout ──
    // Stacked: ASCII art on top, key-value pairs below (safe for narrow panels)
    const C = ANSI.cyan;
    const G = ANSI.green;
    const W = ANSI.white;
    const D = ANSI.dim;
    const B = ANSI.bold;
    const R = ANSI.reset;
    const Y = ANSI.yellow;
    const M = ANSI.magenta;

    let out = "\n";

    // ASCII Logo
    out += `  ${C}${B}██╗    ██╗${R}  ${C}${B}wh${R}${D}@${R}${G}${B}terminal${R}\n`;
    out += `  ${C}${B}██║    ██║${R}  ${D}${"─".repeat(18)}${R}\n`;
    out += `  ${C}${B}██║ █╗ ██║${R}  ${C}Version${R}  ${W}${version}${R}\n`;
    out += `  ${C}${B}██║███╗██║${R}  ${C}Uptime${R}   ${W}${uptime}${R}\n`;
    out += `  ${C}${B}╚███╔███╔╝${R}  ${C}Theme${R}    ${W}${themeName}${R}\n`;
    out += `  ${C}${B} ╚══╝╚══╝${R}   ${C}Session${R}  ${W}${sessionCmds} cmds${R}\n`;
    out += `  ${M}${B}HAPPENED${R}    ${C}Browser${R}  ${W}${browser}${R}\n`;
    out += `  ${D}Infra Terminal${R}  ${C}OS${R}       ${W}${os}${R}\n`;

    // Separator
    out += `  ${D}${"─".repeat(34)}${R}\n`;

    // System info block
    out += `  ${C}Node IP${R}    ${Y}${publicIp}${R}\n`;
    out += `  ${C}Tabs${R}       ${W}${tabCount} open${R}\n`;
    out += `  ${C}Memory${R}     ${W}${memInfo}${R}\n`;
    out += `  ${C}Storage${R}    ${W}${storageInfo}${R}\n`;

    // Separator
    out += `  ${D}${"─".repeat(34)}${R}\n`;

    // Color palette bar
    const colors = [
        "\x1b[40m  ", "\x1b[41m  ", "\x1b[42m  ", "\x1b[43m  ",
        "\x1b[44m  ", "\x1b[45m  ", "\x1b[46m  ", "\x1b[47m  ",
    ];
    const brightColors = [
        "\x1b[100m  ", "\x1b[101m  ", "\x1b[102m  ", "\x1b[103m  ",
        "\x1b[104m  ", "\x1b[105m  ", "\x1b[106m  ", "\x1b[107m  ",
    ];
    out += `  ${colors.join("")}${R}\n`;
    out += `  ${brightColors.join("")}${R}\n`;

    // Footer
    out += `\n  ${D}Atomic Architecture · Zero-Cloud Privacy${R}`;
    out += `\n  ${D}github.com/netssv/whathappend${R}\n`;

    return out;
}

