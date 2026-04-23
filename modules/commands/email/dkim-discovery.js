// ===================================================================
// DKIM Discovery Engine — Dynamic MX-Inference
//
// Zero static files. Infers selectors heuristically from MX and SPF
// hostnames using pattern matching against known mail platform
// signatures. Provider-agnostic: no branding strings in output.
// ===================================================================

const BASE_SELECTORS = ["default", "s1", "s2", "key1", "key2", "mail", "dkim", "email"];

// Tokens too generic to be useful as selectors
const EXCLUDED = [
    "com", "net", "org", "io", "co", "uk", "au", "ca", "de", "fr", "br",
    "mail", "smtp", "pop", "imap", "protection", "spf", "aspmx", "mx",
    "www", "app", "api", "host", "relay", "mta", "gateway", "inbound",
    "outbound", "cluster", "edge", "server", "primary", "secondary",
];

/**
 * MX-Inference Rules — pattern → selectors to add.
 * Each entry: [substring to match in MX/SPF host, selectors to inject].
 * Ordered by specificity (most specific first).
 */
const MX_INFERENCE_RULES = [
    // Microsoft 365 / Exchange Online
    ["outlook.com",        ["selector1", "selector2"]],
    ["microsoft.com",      ["selector1", "selector2"]],
    ["exchange",           ["selector1", "selector2"]],
    // Google Workspace
    ["google.com",         ["google"]],
    ["googlemail.com",     ["google"]],
    ["aspmx",              ["google"]],
    // Zoho
    ["zoho.com",           ["zmail"]],
    ["zoho.eu",            ["zmail"]],
    ["zohomail",           ["zmail"]],
    // ProtonMail
    ["protonmail",         ["protonmail", "protonmail2", "protonmail3"]],
    ["proton.me",          ["protonmail", "protonmail2", "protonmail3"]],
    // Shared hosting / webmail platforms (generic mail infra)
    ["megamailservers",    ["hmail"]],
    ["mailhostbox",        ["hmail"]],
    ["registrar-servers",  ["default", "mail"]],
    // Transactional / ESP platforms
    ["sendgrid",           ["s1", "s2", "sendgrid"]],
    ["mailgun",            ["smtp", "mailo", "k1"]],
    ["amazonses",          ["dkim"]],
    ["amazonaws",          ["dkim"]],
    ["mailchimp",          ["k1"]],
    ["mandrillapp",        ["mandrill"]],
    ["postmarkapp",        ["pm"]],
    ["sparkpost",          ["sparkpost"]],
    ["mcsv.net",           ["k1"]],
    // Hosting-bundled mail
    ["dreamhost",          ["dreamhost"]],
    ["bluehost",           ["default"]],
    ["godaddy",            ["default"]],
    ["namecheap",          ["default"]],
    ["ovh.",               ["ovh"]],
    ["gandi.",             ["gandi"]],
    // Fastmail
    ["fastmail",           ["fm1", "fm2", "fm3"]],
    ["messagingengine",    ["fm1", "fm2", "fm3"]],
    // Migadu
    ["migadu",             ["key1"]],
    // Mimecast
    ["mimecast",           ["mimecast"]],
    // Barracuda
    ["barracuda",          ["barracuda"]],
];

/**
 * Infer possible DKIM selectors dynamically from MX and SPF hosts.
 *
 * Strategy:
 *   1. Start with a base set of universally common selectors.
 *   2. Pattern-match each MX/SPF hostname against known mail platform
 *      signatures and inject platform-specific selectors.
 *   3. Tokenize hostnames: extract non-TLD subdomain segments as
 *      candidate selectors (plus numeric variants like "token1").
 *
 * @param {string[]} mxData  - MX record targets (e.g. "10 mail.example.com")
 * @param {string[]} spfData - Domains from SPF 'include:' directives
 * @returns {string[]} Unique selectors to probe
 */
export function getPossibleSelectors(mxData = [], spfData = []) {
    const selectors = new Set(BASE_SELECTORS);
    const combined = [...mxData, ...spfData]
        .filter(Boolean)
        .map(h => h.replace(/^\d+\s+/, "").toLowerCase().replace(/\.$/, ""));

    for (const host of combined) {
        // ── Rule-based inference ──
        for (const [pattern, sels] of MX_INFERENCE_RULES) {
            if (host.includes(pattern)) {
                for (const s of sels) selectors.add(s);
            }
        }

        // ── Generic token extraction ──
        const parts = host.split(".").filter(p => p.length > 2 && !EXCLUDED.includes(p));
        for (const part of parts) {
            selectors.add(part);
            selectors.add(`${part}1`);
        }
    }

    return Array.from(selectors);
}
