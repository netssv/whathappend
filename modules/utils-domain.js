/**
 * @module modules/utils-domain.js
 * @description Domain/URL/IP utility functions shared across command modules.
 *
 * @connections
 * - Imports: REGEX from './data/constants.js', isIPAddress from './formatter.js'
 * - Exports: stripANSI, isRdapMaintainer, ensureProtocol, daysUntil,
 *            extractDomain, resolveProvider, getProviderFromCNAME
 * - Layer: Shared Utility — pure helpers, no side effects.
 */

import { REGEX } from "./data/constants.js";
import { isIPAddress } from "./formatter.js";

// ── String Helpers ────────────────────────────────────────────────────

export const stripANSI = (s) => s.replace(REGEX.ANSI_STRIP, "");

// ── URL / Domain ──────────────────────────────────────────────────────

export function ensureProtocol(url) {
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : "https://" + url;
}

export function extractDomain(urlString) {
    if (!urlString) return null;
    try {
        const url = new URL(urlString);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.hostname || null;
    } catch (_) {
        return null;
    }
}

export function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

// ── Provider / RDAP ───────────────────────────────────────────────────

/**
 * Detect RDAP/RIPE maintainer entities that aren't real provider names.
 * Matches: MNT-LARSEN, AS8560-MNT, AS-12345, etc.
 */
export function isRdapMaintainer(name) {
    if (!name) return false;
    const u = name.toUpperCase();
    return u.endsWith("-MNT") || u.startsWith("MNT-") || /^AS\d/.test(u);
}

/** Resolve the human-readable root from a CNAME record. */
export function getProviderFromCNAME(target) {
    if (!target) return null;
    const parts = target.replace(/\.$/, "").split(".");
    if (parts.length >= 2) {
        const root = parts.slice(-2).join(".");
        return root.charAt(0).toUpperCase() + root.slice(1);
    }
    return target;
}

/** Resolve the provider/owner of an IP via RDAP. No static DB — fully dynamic. */
export async function resolveProvider(target) {
    if (!target) return null;
    if (isIPAddress(target)) {
        try {
            const resp = await chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip: target } });
            if (resp?.success && resp.org) return resp.org;
        } catch (_) {}
    }
    return null;
}
