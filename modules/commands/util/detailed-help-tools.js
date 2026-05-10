/**
 * @module modules/commands/util/detailed-help-tools.js
 * @description Help entries for core session and workflow utility commands.
 *              (start, target, switch, config, info, tabs, flush, edit,
 *               audit, ext, export, clip, errors)
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
        "  Without arguments, auto-detects the current browser tab domain",
        "  and runs a sequential triage: DNS, HTTP, SSL, and security headers.",
        "  With a domain, sets it as the target and begins immediately.",
        "",
        "REAL USE CASES:",
        "  - Open any website and run 'start' for an instant infrastructure audit.",
        "  - Pass a domain to analyze without navigating to the site first.",
    ], aliases: "run, go, begin, analyze", examples: [
        { cmd: "start",            desc: "Analyze the active tab" },
        { cmd: "start google.com", desc: "Set target and analyze" },
    ] }),

    target: () => formatHelp({ name: "target", syntax: "[domain|auto]", descLines: [
        "Set or display the active target domain.",
        "All subsequent commands that accept a domain use this as default.",
    ], aliases: null, examples: [
        { cmd: "target example.com", desc: "Set target" },
        { cmd: "target",             desc: "Show current target" },
        { cmd: "target auto",        desc: "Reset to active tab URL" },
    ] }),

    switch: () => formatHelp({ name: "switch", syntax: "", descLines: [
        "Re-sync the terminal target to the currently active browser tab.",
        "Use this when the automatic tab-switch notification was dismissed",
        "or did not appear after switching tabs.",
    ], aliases: "actual, current, here, sw", examples: [
        { cmd: "switch", desc: "Adopt active tab as target" },
    ] }),

    config: () => formatHelp({ name: "config", syntax: "[key] [value]", descLines: [
        "View and modify user preferences (stored locally, zero-cloud).",
        "",
        "  timeout       Request timeout in milliseconds (max 10000).",
        "  auto-triage   Run triage automatically on tab switch (on/off).",
        "  expert-mode   Show raw technical output instead of summaries (on/off).",
        "  reset         Restore all settings to their defaults.",
    ], aliases: "settings, set, prefs", examples: [
        { cmd: "config",                 desc: "Show all settings" },
        { cmd: "config timeout 5000",    desc: "Set 5-second timeout" },
        { cmd: "config auto-triage off", desc: "Disable auto-triage" },
        { cmd: "config reset",           desc: "Restore defaults" },
    ] }),

    info: () => formatHelp({ name: "info", syntax: "", descLines: [
        "System diagnostics and local telemetry.",
        "Shows extension version, Native Host connection status,",
        "browser engine, and current session command count.",
    ], aliases: "telemetry, status", examples: [{ cmd: "info" }] }),

    tabs: () => formatHelp({ name: "tabs", syntax: "[action]", descLines: [
        "Browser tab management.",
        "",
        "  list    Show all open tabs with title and URL.",
        "  diag    Scan tabs for memory and performance issues.",
        "  close   Close tabs matching a keyword (e.g. tabs close github).",
        "  flush   Clear cookies and cache for a specific tab.",
        "  watch   Live-monitor a tab's network activity.",
    ], aliases: "tab, tablist", examples: [
        { cmd: "tabs list" },
        { cmd: "tabs diag" },
        { cmd: "tabs close github", desc: "Close all GitHub tabs" },
        { cmd: "tabs flush 1",      desc: "Flush tab #1 cookies" },
    ] }),

    flush: () => formatHelp({ name: "flush", syntax: "<domain>", descLines: [
        "Clear cookies and cache for a specific domain origin.",
        "Uses chrome.browsingData scoped to the exact origin for safety.",
        "Requires an explicit domain — does not default to the active target.",
    ], aliases: "clearcache, clear-cache", examples: [
        { cmd: "flush example.com" },
    ] }),

    edit: () => formatHelp({ name: "edit", syntax: "[--test]", descLines: [
        "Toggle Live Design Mode on the active tab.",
        "Enables document.designMode so you can click anywhere and type",
        "to modify text content visually. Use --test to check without toggling.",
    ], aliases: "designmode, modify", examples: [
        { cmd: "edit" },
        { cmd: "edit --test" },
    ] }),

    audit: () => formatHelp({ name: "audit", syntax: "[domain]", descLines: [
        "Marketing audit suite.",
        "Runs SEO, Open Graph, accessibility (alt tags), and",
        "schema structured data checks sequentially in one command.",
    ], aliases: "marketing", examples: [{ cmd: "audit google.com" }] }),

    ext: () => formatHelp({ name: "ext", syntax: "<ssl|bl|headers|whois> [domain]", descLines: [
        "External tool link generator.",
        "Opens industry-standard external analysis tools for a given domain.",
        "Supported: ssl (SSL Labs), bl (MXToolBox), headers, whois (ICANN).",
    ], aliases: "-", examples: [
        { cmd: "ext ssl google.com" },
        { cmd: "ext bl google.com", desc: "Blacklist check" },
    ] }),

    "export": () => formatHelp({ name: "export", syntax: "[json|csv]", descLines: [
        "Export the terminal session to a shareable file.",
        "Saves all commands and their output as a structured report.",
    ], aliases: "dump, report, save", examples: [
        { cmd: "export json" },
        { cmd: "export csv" },
    ] }),

    clip: () => formatHelp({ name: "clip", syntax: "[domain|target]", descLines: [
        "Copy the session to clipboard as formatted Markdown.",
        "",
        "  No argument:      Copy the full session.",
        "  clip target:      Copy only entries for the active target domain.",
        "  clip example.com: Filter by a specific domain.",
        "",
        "Ready to paste into Jira, Slack, Notion, or email.",
    ], aliases: "copy, clipboard", examples: [
        { cmd: "clip",            desc: "Full session" },
        { cmd: "clip target",     desc: "Active target only" },
        { cmd: "clip google.com", desc: "Filter by domain" },
    ] }),

    errors: () => formatHelp({ name: "errors", syntax: "", descLines: [
        "Error and diagnostic insight reference guide.",
        "Lists common network and DNS errors with explanations and fixes.",
    ], aliases: "error, error-list", examples: [{ cmd: "errors" }] }),
};
