/**
 * @module modules/commands/util/detailed-help-web.js
 * @description Help entries for web health, SEO, and content analysis commands.
 *              (web, robots, links, pixels, socials, seo, og, alt, schema, minify, stack)
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
        "",
        "WHAT IS IT?",
        "  Runs a sequential 3-part audit: A record resolution, HTTP response",
        "  headers and status code, and SSL/TLS certificate validation.",
        "",
        "REAL USE CASES:",
        "  - Run as the first check on any new domain to get a baseline.",
        "  - Confirm a migrated site is reachable, secure, and responding.",
        "  - Detect mismatches between expected and actual server IPs.",
    ], aliases: "audit", examples: [{ cmd: "web google.com" }] }),

    robots: () => formatHelp({ name: "robots", syntax: "[domain]", descLines: [
        "Parse and analyze the robots.txt file for SEO directives.",
        "",
        "WHAT IS IT?",
        "  Fetches and parses /robots.txt, checking for Disallow rules, sitemap",
        "  declarations, crawl-delay, and syntax errors.",
        "",
        "REAL USE CASES:",
        "  - Confirm critical pages are not accidentally blocked from crawlers.",
        "  - Find a Sitemap: URL declaration for quick sitemap access.",
        "  - Detect a Disallow: / rule that blocks all crawlers (site-wide).",
        "  - Audit after a migration to ensure no paths were unintentionally blocked.",
    ], aliases: "sitemap", examples: [
        { cmd: "robots google.com" },
        { cmd: "sitemap", desc: "Active tab" },
    ] }),

    links: () => formatHelp({ name: "links", syntax: "", descLines: [
        "Mixed content and link scanner (active tab).",
        "",
        "WHAT IS IT?",
        "  Scans all hyperlinks and asset sources in the DOM, flagging insecure",
        "  http:// resources on an HTTPS page (mixed content violations).",
        "",
        "REAL USE CASES:",
        "  - Find all insecure http:// assets that browsers will block.",
        "  - Audit external link destinations for redirect chains or 404s.",
        "  - Locate broken or malformed links before publication.",
    ], aliases: "src", examples: [{ cmd: "links", desc: "Active tab only" }] }),

    pixels: () => formatHelp({ name: "pixels", syntax: "[domain]", descLines: [
        "Marketing and tracking pixel detector.",
        "",
        "WHAT IS IT?",
        "  Analyzes network requests and DOM scripts to fingerprint installed",
        "  tracking and analytics platforms across 20+ known providers.",
        "",
        "REAL USE CASES:",
        "  - Confirm Meta Pixel and GA4 are installed and firing correctly.",
        "  - Audit for unauthorized trackers added by a third party.",
        "  - Produce a tracker inventory for a GDPR compliance review.",
        "  - Detect duplicate or conflicting analytics installations.",
    ], aliases: "tracking, trackers, ads", examples: [{ cmd: "pixels shopify.com" }] }),

    socials: () => formatHelp({ name: "socials", syntax: "[domain]", descLines: [
        "Social media presence detector.",
        "",
        "WHAT IS IT?",
        "  Scans page HTML for links to major social platforms and extracts",
        "  the account handles or profile URLs for each found network.",
        "",
        "REAL USE CASES:",
        "  - Quickly map a brand's social footprint from their website.",
        "  - Verify all expected social links are present before a launch.",
        "  - Audit competitor social presence as part of market research.",
    ], aliases: "social", examples: [{ cmd: "socials google.com" }] }),

    seo: () => formatHelp({ name: "seo", syntax: "[domain]", descLines: [
        "Baseline SEO tag audit.",
        "",
        "WHAT IS IT?",
        "  Checks the core on-page SEO elements: title tag length, meta description",
        "  presence and length, canonical URL, and heading tag hierarchy.",
        "",
        "REAL USE CASES:",
        "  - Verify title is 50-60 characters before a page goes live.",
        "  - Detect duplicate or missing meta descriptions across key pages.",
        "  - Confirm exactly one H1 exists with proper H2/H3 structure below it.",
        "  - Catch missing canonical tags that cause duplicate content issues.",
    ], aliases: "meta, tags", examples: [
        { cmd: "seo google.com" },
        { cmd: "seo", desc: "Active tab" },
    ] }),

    og: () => formatHelp({ name: "og", syntax: "[domain]", descLines: [
        "Open Graph and social card preview scanner.",
        "",
        "WHAT IS IT?",
        "  Reads og:title, og:image, og:description, twitter:card, and related",
        "  meta tags that control how links render when shared on social media.",
        "",
        "REAL USE CASES:",
        "  - Verify a page shows the correct image and title on LinkedIn.",
        "  - Detect missing og:image that causes a blank preview on Facebook.",
        "  - Confirm twitter:card is set to summary_large_image for better CTR.",
        "  - Run before a campaign launch to guarantee social previews are correct.",
    ], aliases: "opengraph, cards", examples: [
        { cmd: "og example.com" },
        { cmd: "og", desc: "Active tab" },
    ] }),

    alt: () => formatHelp({ name: "alt", syntax: "[domain]", descLines: [
        "Image accessibility scanner.",
        "",
        "WHAT IS IT?",
        "  Scans all img elements in the DOM and reports those missing the alt",
        "  attribute or using empty alt values on meaningful images.",
        "",
        "REAL USE CASES:",
        "  - Required for WCAG 2.1 Level AA compliance.",
        "  - Detect missing alt text that causes image SEO signal loss.",
        "  - Audit before a public sector or government site submission.",
    ], aliases: "images, a11y", examples: [
        { cmd: "alt example.com" },
        { cmd: "alt", desc: "Active tab" },
    ] }),

    schema: () => formatHelp({ name: "schema", syntax: "[domain]", descLines: [
        "Structured data scanner (JSON-LD and Microdata).",
        "",
        "WHAT IS IT?",
        "  Extracts schema.org markup from the page — the metadata that powers",
        "  Google rich results (star ratings, FAQs, breadcrumbs, events).",
        "",
        "REAL USE CASES:",
        "  - Verify product schema is present for e-commerce rich results.",
        "  - Detect malformed JSON-LD that would fail Google's validation.",
        "  - Find missing FAQ schema on support or landing pages.",
    ], aliases: "structured, jsonld, microdata", examples: [
        { cmd: "schema google.com" },
        { cmd: "schema", desc: "Active tab" },
    ] }),

    minify: () => formatHelp({ name: "minify", syntax: "[domain]", descLines: [
        "Asset minification audit.",
        "",
        "WHAT IS IT?",
        "  Scans script and link tags for .js and .css file references, flagging",
        "  files missing the .min suffix as potentially uncompressed assets.",
        "",
        "REAL USE CASES:",
        "  - Identify development builds deployed to production by mistake.",
        "  - Estimate bandwidth waste from unminified assets at scale.",
        "  - Confirm a build pipeline is outputting minified bundles correctly.",
    ], aliases: "min, assets", examples: [
        { cmd: "minify google.com" },
        { cmd: "minify", desc: "Active tab" },
    ] }),

    stack: () => formatHelp({ name: "stack", syntax: "[domain]", descLines: [
        "Technology stack fingerprinting.",
        "",
        "WHAT IS IT?",
        "  Identifies the CMS, JavaScript framework, server software, analytics,",
        "  and CDN provider by analyzing HTTP headers, HTML meta tags, and DOM.",
        "",
        "REAL USE CASES:",
        "  - Identify the CMS (WordPress, Shopify, Webflow) before a migration.",
        "  - Detect JavaScript frameworks (React, Vue, Angular, Next.js) in use.",
        "  - Research a competitor's technology choices for benchmarking.",
        "  - Use as first step in a security assessment to narrow attack surface.",
    ], aliases: "tech, cms, wappalyzer, techstack", examples: [{ cmd: "stack google.com" }] }),
};
