/**
 * @module modules/commands/util/tabs-watch-data-lists.js
 * @description Static data lists for the watch data engine.
 *              Tracker domain signatures and performance budget defaults.
 *
 * @connections
 * - Imports: none
 * - Exports: TRACKER_DOMAINS, PERF_BUDGET
 * - Layer: Command Layer (Util) — static data, no logic.
 */

// ── Known Tracker Domains (heuristic fingerprinting) ─────────────────

export const TRACKER_DOMAINS = [
    "google-analytics.com", "googletagmanager.com", "doubleclick.net",
    "googlesyndication.com", "googleadservices.com",
    "facebook.net", "facebook.com/tr", "fbcdn.net",
    "analytics.tiktok.com", "snap.licdn.com", "ads-twitter.com",
    "hotjar.com", "clarity.ms", "segment.com", "mixpanel.com",
    "amplitude.com", "newrelic.com", "nr-data.net", "sentry.io",
    "bat.bing.com", "sc-static.net", "pinimg.com/ct",
    "criteo.com", "taboola.com", "outbrain.com",
    "adnxs.com", "rubiconproject.com", "pubmatic.com",
];

// ── Default Performance Budget ───────────────────────────────────────

export const PERF_BUDGET = {
    totalKB:    1500,   // 1.5 MB total page weight
    jsKB:       400,    // 400 KB JavaScript
    cssKB:      100,    // 100 KB CSS
    imgKB:      800,    // 800 KB images
    fontKB:     100,    // 100 KB fonts
    requests:   80,     // 80 total requests
    domNodes:   1500,   // 1500 DOM nodes
    thirdParty: 30,     // 30% max third-party weight
};
