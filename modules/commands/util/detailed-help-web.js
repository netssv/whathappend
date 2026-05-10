/**
 * @module modules/commands/util/detailed-help-web.js
 * @description Help entries for web content, SEO, and page inspection commands.
 *              (web, robots, links, pixels, socials, seo, og, alt, schema,
 *               minify, stack, vitals, cms, fonts, palette, comments, emails, phones)
 *
 * @connections
 * - Imports: formatHelp from './detailed-help.js'
 * - Exports: WEB_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp } from "./detailed-help.js";

export const WEB_HELP = {
    web: () => formatHelp({ name: "web", syntax: "[domain]", descLines: [
        "General website health check.",
        "Combines IP resolution (A record), HTTP server response,",
        "and SSL/TLS certificate validation into one sequential audit.",
    ], aliases: "audit", examples: [{ cmd: "web google.com" }] }),

    robots: () => formatHelp({ name: "robots", syntax: "[domain]", descLines: [
        "Parse robots.txt for SEO directives.",
        "Detects blocked paths, missing sitemaps, and syntax errors.",
    ], aliases: "sitemap", examples: [
        { cmd: "robots google.com" },
        { cmd: "sitemap", desc: "Active tab" },
    ] }),

    links: () => formatHelp({ name: "links", syntax: "", descLines: [
        "Mixed content and link scanner (active tab).",
        "",
        "REAL USE CASES:",
        "  - Find all insecure http:// assets on an HTTPS page.",
        "  - Audit external link destinations before publication.",
        "  - Locate broken or relative links that would cause 404 errors.",
    ], aliases: "src", examples: [{ cmd: "links", desc: "Active tab only" }] }),

    pixels: () => formatHelp({ name: "pixels", syntax: "[domain]", descLines: [
        "Marketing and tracking pixel detector.",
        "",
        "REAL USE CASES:",
        "  - Confirm Meta Pixel and Google Analytics are installed correctly.",
        "  - Audit a site for unauthorized trackers added post-launch.",
        "  - Detects 20+ platforms: Meta, GA4, LinkedIn, TikTok, Hotjar, and more.",
    ], aliases: "tracking, trackers, ads", examples: [{ cmd: "pixels shopify.com" }] }),

    socials: () => formatHelp({ name: "socials", syntax: "[domain]", descLines: [
        "Social media presence detector.",
        "Scans the page HTML for links to Facebook, Twitter/X, Instagram, LinkedIn.",
    ], aliases: "social", examples: [{ cmd: "socials google.com" }] }),

    seo: () => formatHelp({ name: "seo", syntax: "[domain]", descLines: [
        "Baseline SEO tag audit.",
        "",
        "REAL USE CASES:",
        "  - Check title length (50-60 chars) and meta description presence.",
        "  - Verify heading hierarchy: single H1, logical H2/H3 structure.",
        "  - Catch duplicate or missing meta tags before a site launch.",
    ], aliases: "meta, tags", examples: [
        { cmd: "seo google.com" },
        { cmd: "seo", desc: "Active tab" },
    ] }),

    og: () => formatHelp({ name: "og", syntax: "[domain]", descLines: [
        "Open Graph and social card preview scanner.",
        "Checks og:title, og:image, og:description, and twitter:card",
        "to ensure links render correctly when shared on social platforms.",
    ], aliases: "thaks, opengraph, cards", examples: [
        { cmd: "og example.com" },
        { cmd: "og", desc: "Active tab" },
    ] }),

    alt: () => formatHelp({ name: "alt", syntax: "[domain]", descLines: [
        "Image accessibility scanner.",
        "Checks all <img> tags for missing or empty alt attributes.",
        "Required for WCAG 2.1 AA compliance.",
    ], aliases: "images, a11y", examples: [
        { cmd: "alt example.com" },
        { cmd: "alt", desc: "Active tab" },
    ] }),

    schema: () => formatHelp({ name: "schema", syntax: "[domain]", descLines: [
        "Structured data scanner (JSON-LD and Microdata).",
        "Extracts and validates schema.org markup used for rich results in search.",
    ], aliases: "structured, jsonld, microdata", examples: [
        { cmd: "schema google.com" },
        { cmd: "schema", desc: "Active tab" },
    ] }),

    minify: () => formatHelp({ name: "minify", syntax: "[domain]", descLines: [
        "Asset minification audit.",
        "Scans DOM script and link tags for .js and .css files",
        "that are missing the .min suffix, indicating uncompressed assets.",
    ], aliases: "min, assets", examples: [
        { cmd: "minify google.com" },
        { cmd: "minify", desc: "Active tab" },
    ] }),

    stack: () => formatHelp({ name: "stack", syntax: "[domain]", descLines: [
        "Technology stack fingerprinting.",
        "",
        "REAL USE CASES:",
        "  - Identify the CMS (WordPress, Shopify, Webflow) from headers and meta.",
        "  - Detect JavaScript frameworks (React, Vue, Angular, Next.js).",
        "  - Find server software and CDN provider for infrastructure analysis.",
    ], aliases: "tech, cms, wappalyzer, techstack", examples: [{ cmd: "stack google.com" }] }),

    vitals: () => formatHelp({ name: "vitals", syntax: "", descLines: [
        "Core Web Vitals scorecard (active tab).",
        "",
        "REAL USE CASES:",
        "  - Grade LCP (load), CLS (layout shift), and INP (interaction).",
        "  - Compare performance before and after a code change.",
        "  - Combine with throttle to simulate slow-connection vitals.",
    ], aliases: "cwv, web-vitals, core-vitals", examples: [
        { cmd: "vitals", desc: "Active tab" },
    ] }),

    cms: () => formatHelp({ name: "cms", syntax: "[--test]", descLines: [
        "CMS and plugin fingerprinting (active tab).",
        "Analyzes DOM, meta tags, and asset paths to identify the CMS,",
        "its version, and installed plugins.",
    ], aliases: "wordpress, fingerprint", examples: [
        { cmd: "cms" },
        { cmd: "cms --test" },
    ] }),

    fonts: () => formatHelp({ name: "fonts", syntax: "[--test]", descLines: [
        "List all web fonts loaded by the active tab.",
        "Evaluates document.fonts and parses CSS to enumerate font families.",
    ], aliases: "typography, type", examples: [
        { cmd: "fonts" },
        { cmd: "fonts --test" },
    ] }),

    palette: () => formatHelp({ name: "palette", syntax: "[--test]", descLines: [
        "Extract the color palette from the active tab.",
        "Parses stylesheets and inline styles to list the most-used hex/RGB colors.",
    ], aliases: "colors, theme", examples: [
        { cmd: "palette" },
        { cmd: "palette --test" },
    ] }),

    comments: () => formatHelp({ name: "comments", syntax: "[--test]", descLines: [
        "Extract hidden HTML and JS comments from the active tab.",
        "",
        "REAL USE CASES:",
        "  - Find developer notes left in production code (credentials, TODOs).",
        "  - Locate commented-out debug blocks that could leak information.",
    ], aliases: "hidden, notes, note, memo, annotation", examples: [
        { cmd: "comments" },
        { cmd: "comments --test" },
    ] }),

    emails: () => formatHelp({ name: "emails", syntax: "[--test]", descLines: [
        "Email address extractor from the active tab DOM.",
        "Finds and deduplicates mailto: links and text-pattern email addresses.",
    ], aliases: "scrape-emails, contacts", examples: [
        { cmd: "emails" },
        { cmd: "emails --test" },
    ] }),

    phones: () => formatHelp({ name: "phones", syntax: "[--test]", descLines: [
        "Phone number extractor from the active tab DOM.",
        "Finds tel: links and text-pattern numbers in international format.",
    ], aliases: "scrape-phones, numbers", examples: [
        { cmd: "phones" },
        { cmd: "phones --test" },
    ] }),
};
