/**
 * @module modules/commands/util/detailed-help-tools.js
 * @description Help entries for core session and workflow utility commands.
 *              (start, target, switch, config, info, tabs, flush, edit)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: TOOLS_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const TOOLS_HELP = {
    start: () => formatHelp({ name: "start", syntax: "[domain]", descLines: [
        "Quick-start progressive analysis of the active tab.",
        "",
        "WHAT IS IT?",
        "  Without arguments, auto-detects the current browser tab domain and",
        "  runs a sequential triage: DNS resolution, HTTP response, SSL cert,",
        "  and security headers. With a domain, sets it as target immediately.",
        "",
        "REAL USE CASES:",
        "  - Open any website and run 'start' for an instant infrastructure audit.",
        "  - Pass a domain to analyze without navigating to the site first.",
        "  - Use as a first step before running individual diagnostic commands.",
    ], aliases: "run, go, begin, analyze", examples: [
        { cmd: "start",            desc: "Analyze the active tab" },
        { cmd: "start google.com", desc: "Set target and analyze" },
    ] }),

    target: () => formatHelp({ name: "target", syntax: "[domain|auto]", descLines: [
        "Set or display the active target domain.",
        "",
        "WHAT IS IT?",
        "  Sets a persistent target domain for the session. All subsequent",
        "  commands that accept a domain will use this as their default input.",
        "",
        "REAL USE CASES:",
        "  - Set once at the start of an audit session to avoid retyping the domain.",
        "  - Use 'target auto' to reset to the current browser tab URL.",
        "  - Run 'target' with no args to confirm which domain is active.",
    ], aliases: null, examples: [
        { cmd: "target example.com", desc: "Set target" },
        { cmd: "target",             desc: "Show current target" },
        { cmd: "target auto",        desc: "Reset to active tab URL" },
    ] }),

    switch: () => formatHelp({ name: "switch", syntax: "", descLines: [
        "Re-sync the terminal target to the currently active browser tab.",
        "",
        "WHAT IS IT?",
        "  Reads the URL of the currently focused browser tab and sets it as",
        "  the active target. Use this when automatic tab detection fails.",
        "",
        "REAL USE CASES:",
        "  - Re-sync after the automatic tab-switch notification was dismissed.",
        "  - Use after opening a new tab that was not detected automatically.",
        "  - Quickly switch context when auditing multiple sites.",
    ], aliases: "actual, current, here, sw", examples: [
        { cmd: "switch", desc: "Adopt active tab as target" },
    ] }),

    config: () => formatHelp({ name: "config", syntax: "[key] [value]", descLines: [
        "View and modify user preferences (stored locally, zero-cloud).",
        "",
        "WHAT IS IT?",
        "  All settings are persisted via chrome.storage.local — nothing leaves",
        "  the browser. Changes take effect immediately without a reload.",
        "",
        "  timeout       Request timeout in milliseconds (max 10000).",
        "  auto-triage   Automatically run triage on tab switch (on/off).",
        "  expert-mode   Show raw technical output instead of summaries (on/off).",
        "  reset         Restore all settings to their factory defaults.",
    ], aliases: "settings, set, prefs", examples: [
        { cmd: "config",                 desc: "Show all current settings" },
        { cmd: "config timeout 5000",    desc: "Set 5-second request timeout" },
        { cmd: "config auto-triage off", desc: "Disable auto-triage on tab switch" },
        { cmd: "config reset",           desc: "Restore factory defaults" },
    ] }),

    info: () => formatHelp({ name: "info", syntax: "", descLines: [
        "System diagnostics and local telemetry.",
        "",
        "WHAT IS IT?",
        "  Displays the current state of the extension: version, Native Host",
        "  connection status, active browser engine, and session command count.",
        "",
        "REAL USE CASES:",
        "  - Confirm the extension version before filing a bug report.",
        "  - Verify the Native Host is connected (required for sudo commands).",
        "  - Check session command count for usage or compliance reporting.",
    ], aliases: "telemetry, status", examples: [{ cmd: "info" }] }),

    tabs: () => formatHelp({ name: "tabs", syntax: "[action]", descLines: [
        "Browser tab management suite.",
        "",
        "WHAT IS IT?",
        "  A unified interface for inspecting and controlling all open browser",
        "  tabs directly from the terminal.",
        "",
        "  list          Show all open tabs with title and URL.",
        "  diag          Scan all tabs for memory and performance issues.",
        "  close <term>  Close tabs whose title or URL matches the keyword.",
        "  flush <#>     Clear cookies and cache for the tab at index #.",
        "  watch <#>     Live-monitor the network activity of a specific tab.",
        "  info <#>      Show detailed info for the tab at index #.",
        "",
        "REAL USE CASES:",
        "  - Use 'tabs diag' to find tabs consuming excessive memory.",
        "  - Close all staging tabs at once: tabs close staging.",
        "  - Flush a single tab's cache without affecting other origins.",
    ], aliases: "tab, tablist", examples: [
        { cmd: "tabs list" },
        { cmd: "tabs diag" },
        { cmd: "tabs close github", desc: "Close all GitHub tabs" },
        { cmd: "tabs flush 1",      desc: "Flush cache for tab #1" },
    ] }),

    flush: () => formatHelp({ name: "flush", syntax: "<domain>", descLines: [
        "Clear cookies and browser cache for a specific domain origin.",
        "",
        "WHAT IS IT?",
        "  Uses chrome.browsingData scoped to the exact origin, so only the",
        "  target domain is affected. Requires an explicit domain argument.",
        "",
        "REAL USE CASES:",
        "  - Force a fresh page load after deploying a new release.",
        "  - Clear a stale session cookie causing a login loop.",
        "  - Reset cached assets during front-end debugging.",
        "  - Test first-visit behavior (cookie banners, onboarding flows).",
    ], aliases: "clearcache, clear-cache", examples: [
        { cmd: "flush example.com" },
    ] }),

    edit: () => formatHelp({ name: "edit", syntax: "[--test]", descLines: [
        "Toggle Live Design Mode on the active tab.",
        "",
        "WHAT IS IT?",
        "  Enables document.designMode on the page, allowing you to click",
        "  anywhere and type to modify visible text content directly in the browser.",
        "",
        "REAL USE CASES:",
        "  - Create quick mockups by editing copy directly on a live page.",
        "  - Take edited screenshots for presentations without a design tool.",
        "  - Demonstrate content changes to a client in real time.",
        "  - Use --test to verify the page supports editability before toggling.",
    ], aliases: "designmode, modify", examples: [
        { cmd: "edit" },
        { cmd: "edit --test" },
    ] }),
};
