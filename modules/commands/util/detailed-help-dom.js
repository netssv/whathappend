/**
 * @module modules/commands/util/detailed-help-dom.js
 * @description Help entries for DOM scraping, performance vitals, and page extraction.
 *              (vitals, cms, fonts, palette, comments, emails, phones)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: DOM_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const DOM_HELP = {
    vitals: () => formatHelp({ name: "vitals", syntax: "", descLines: [
        "Core Web Vitals scorecard for the active tab.",
        "",
        "WHAT IS IT?",
        "  Reads Google's Core Web Vitals from the PerformanceObserver API:",
        "  LCP (load speed), CLS (layout stability), and INP (interactivity).",
        "",
        "REAL USE CASES:",
        "  - Grade the current page against Google's passing thresholds.",
        "  - Compare vitals before and after a front-end optimization.",
        "  - Use with throttle to simulate vitals on slow mobile connections.",
        "  - Identify layout shift (CLS) caused by late-loading ads or images.",
    ], aliases: "cwv, web-vitals, core-vitals", examples: [
        { cmd: "vitals", desc: "Active tab" },
    ] }),

    cms: () => formatHelp({ name: "cms", syntax: "[--test]", descLines: [
        "CMS and plugin fingerprinting (active tab).",
        "",
        "WHAT IS IT?",
        "  Inspects the DOM, asset paths, and meta tags to identify the CMS,",
        "  its version, and any installed plugins or themes.",
        "",
        "REAL USE CASES:",
        "  - Confirm which WordPress version and plugins are active.",
        "  - Detect unpatched CMS versions with known CVEs.",
        "  - Identify the CMS before planning a migration or redesign.",
    ], aliases: "wordpress, fingerprint", examples: [
        { cmd: "cms" },
        { cmd: "cms --test" },
    ] }),

    fonts: () => formatHelp({ name: "fonts", syntax: "[--test]", descLines: [
        "List all web fonts loaded by the active tab.",
        "",
        "WHAT IS IT?",
        "  Queries document.fonts and parses loaded stylesheets to enumerate",
        "  all font families in use, including their format and source.",
        "",
        "REAL USE CASES:",
        "  - Audit for unlicensed fonts before a commercial site launch.",
        "  - Detect duplicate font families contributing to slow load times.",
        "  - Verify brand typography guidelines are applied consistently.",
    ], aliases: "typography, type", examples: [
        { cmd: "fonts" },
        { cmd: "fonts --test" },
    ] }),

    palette: () => formatHelp({ name: "palette", syntax: "[--test]", descLines: [
        "Extract the color palette from the active tab.",
        "",
        "WHAT IS IT?",
        "  Parses inline styles, stylesheets, and CSS custom properties to",
        "  extract and deduplicate all color values used on the page.",
        "",
        "REAL USE CASES:",
        "  - Verify brand color guidelines are being applied correctly.",
        "  - Detect unauthorized color additions after a design handoff.",
        "  - Extract a palette for use in a design system audit.",
    ], aliases: "colors, theme", examples: [
        { cmd: "palette" },
        { cmd: "palette --test" },
    ] }),

    comments: () => formatHelp({ name: "comments", syntax: "[--test]", descLines: [
        "Extract hidden HTML and JS comments from the active tab.",
        "",
        "WHAT IS IT?",
        "  Walks the DOM for HTML comment nodes and scans inline scripts for",
        "  JS block comments that may contain developer notes or sensitive data.",
        "",
        "REAL USE CASES:",
        "  - Find developer notes left in production code (passwords, TODOs).",
        "  - Locate debug blocks that could expose internal logic or paths.",
        "  - Run as part of a pre-launch code review or security audit.",
    ], aliases: "hidden, notes, note, memo, annotation", examples: [
        { cmd: "comments" },
        { cmd: "comments --test" },
    ] }),

    emails: () => formatHelp({ name: "emails", syntax: "[--test]", descLines: [
        "Email address extractor from the active tab DOM.",
        "",
        "WHAT IS IT?",
        "  Scans the DOM for mailto: hyperlinks and regex-matches plain-text",
        "  email patterns, then deduplicates and lists all found addresses.",
        "",
        "REAL USE CASES:",
        "  - Scrape a contact or team page for email addresses in one step.",
        "  - Audit a page for inadvertently exposed email addresses.",
        "  - Use as input for a deliverability or outreach analysis.",
    ], aliases: "scrape-emails, contacts", examples: [
        { cmd: "emails" },
        { cmd: "emails --test" },
    ] }),

    phones: () => formatHelp({ name: "phones", syntax: "[--test]", descLines: [
        "Phone number extractor from the active tab DOM.",
        "",
        "WHAT IS IT?",
        "  Scans for tel: hyperlinks and text-pattern phone numbers in common",
        "  international formats, then deduplicates and lists all found numbers.",
        "",
        "REAL USE CASES:",
        "  - Extract contact numbers from a business directory page.",
        "  - Verify all phone numbers on a page are formatted consistently.",
        "  - Check for numbers that should be linked (tel:) but are plain text.",
    ], aliases: "scrape-phones, numbers", examples: [
        { cmd: "phones" },
        { cmd: "phones --test" },
    ] }),
};
