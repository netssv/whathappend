import { REGEX } from "./data/constants.js";
import { isIPAddress } from "./formatter.js";

export const stripANSI = (s) => s.replace(REGEX.ANSI_STRIP, "");

/**
 * Detect RDAP/RIPE maintainer entity names that aren't real provider names.
 * Matches: MNT-LARSEN, AS8560-MNT, CLDIN-MNT, AS-12345, etc.
 */
export function isRdapMaintainer(name) {
    if (!name) return false;
    const u = name.toUpperCase();
    return u.endsWith("-MNT") || u.startsWith("MNT-") || /^AS\d/.test(u);
}

export function ensureProtocol(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "https://" + url;
    }
    return url;
}

export function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

export function extractDomain(urlString) {
    if (!urlString) return null;
    try {
        const url = new URL(urlString);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.hostname || null;
    } catch (_e) {
        return null;
    }
}

/**
 * Resolve the provider/owner of an IP or domain via RDAP.
 * No static databases — 100% dynamic.
 */
export async function resolveProvider(target) {
    if (!target) return null;
    if (isIPAddress(target)) {
        // Dynamic RDAP lookup for IP owner
        try {
            const resp = await chrome.runtime.sendMessage({
                command: "ip-whois",
                payload: { ip: target }
            });
            if (resp?.success && resp.org) return resp.org;
        } catch (_) {}
        return null;
    }
    // For domains (e.g. NS hostnames): try static hostname map first
    return null;
}

