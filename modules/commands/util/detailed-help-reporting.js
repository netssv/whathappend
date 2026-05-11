/**
 * @module modules/commands/util/detailed-help-reporting.js
 * @description Help entries for audit generation, external tools, and exporting.
 *              (audit, ext, export, clip, errors)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: REPORTING_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const REPORTING_HELP = {
    audit: () => formatHelp({ name: "audit", syntax: "[domain]", descLines: [
        "Marketing audit suite — runs SEO, OG, alt, and schema checks.",
        "",
        "WHAT IS IT?",
        "  Runs four web content checks sequentially: SEO tags, Open Graph",
        "  social cards, image alt accessibility, and JSON-LD structured data.",
        "",
        "REAL USE CASES:",
        "  - Run before a site launch to catch content and SEO regressions.",
        "  - Audit a competitor's site for marketing infrastructure gaps.",
        "  - Use in a client report to show before/after content improvements.",
    ], aliases: "marketing", examples: [{ cmd: "audit google.com" }] }),

    ext: () => formatHelp({ name: "ext", syntax: "<ssl|bl|headers|whois> [domain]", descLines: [
        "External tool link generator.",
        "",
        "WHAT IS IT?",
        "  Generates deep-link URLs to industry-standard external analysis tools",
        "  for a given domain, opening them in a new browser tab.",
        "",
        "  ssl      SSL Labs — detailed TLS certificate and protocol audit.",
        "  bl       MXToolBox — blacklist and email reputation lookup.",
        "  headers  securityheaders.com — comprehensive security header grader.",
        "  whois    ICANN WHOIS — official domain registration lookup.",
        "",
        "REAL USE CASES:",
        "  - Get an SSL Labs grade (A/B/F) as part of a security report.",
        "  - Check if a client domain is on any email blacklists.",
    ], aliases: "-", examples: [
        { cmd: "ext ssl google.com",     desc: "SSL Labs deep link" },
        { cmd: "ext bl google.com",      desc: "Blacklist check" },
        { cmd: "ext headers google.com", desc: "Header grader" },
    ] }),

    "export": () => formatHelp({ name: "export", syntax: "[json|csv]", descLines: [
        "Export the full terminal session to a structured file.",
        "",
        "WHAT IS IT?",
        "  Serializes all commands run in the current session and their outputs",
        "  into a shareable format: JSON for programmatic use, CSV for spreadsheets.",
        "",
        "REAL USE CASES:",
        "  - Attach a JSON export to a bug report or incident ticket.",
        "  - Share an audit summary with a client as a CSV.",
        "  - Archive a session for compliance or audit trail purposes.",
    ], aliases: "dump, report, save", examples: [
        { cmd: "export json" },
        { cmd: "export csv" },
    ] }),

    clip: () => formatHelp({ name: "clip", syntax: "[domain|target]", descLines: [
        "Copy the terminal session to clipboard as formatted Markdown.",
        "",
        "WHAT IS IT?",
        "  Serializes the current session into Markdown format and copies it",
        "  to the system clipboard, ready to paste into any tool.",
        "",
        "  No argument:      Copy the full session.",
        "  clip target:      Copy only entries for the active target domain.",
        "  clip example.com: Filter by a specific domain.",
        "",
        "REAL USE CASES:",
        "  - Paste audit results into Jira, Notion, Confluence, or Slack.",
        "  - Share a filtered domain report without unrelated command history.",
    ], aliases: "copy, clipboard", examples: [
        { cmd: "clip",            desc: "Full session" },
        { cmd: "clip target",     desc: "Active target only" },
        { cmd: "clip google.com", desc: "Filter by domain" },
    ] }),

    errors: () => formatHelp({ name: "errors", syntax: "", descLines: [
        "Error and diagnostic insight reference guide.",
        "",
        "WHAT IS IT?",
        "  Displays a curated list of common network, DNS, and HTTP errors that",
        "  appear in command output, with explanations and resolution steps.",
        "",
        "REAL USE CASES:",
        "  - Look up what ECONNREFUSED or ETIMEDOUT means in context.",
        "  - Understand why a command returned a specific error code.",
        "  - Use as a reference when explaining findings to non-technical clients.",
    ], aliases: "error, error-list", examples: [{ cmd: "errors" }] }),
};
