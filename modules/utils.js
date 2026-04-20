import { REGEX, CLOUDFLARE_IPS, identifyHostingProvider, identifyIPProvider } from "./data/constants.js";
import { isIPAddress } from "./formatter.js";

export const stripANSI = (s) => s.replace(REGEX.ANSI_STRIP, "");

export function ensureProtocol(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "https://" + url;
    }
    return url;
}

export function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

export function isCloudflareIP(ip) {
    return CLOUDFLARE_IPS.some(p => ip.startsWith(p));
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

export async function resolveProvider(target) {
    if (!target) return null;
    if (isIPAddress(target)) {
        // 1. Cloudflare static ranges
        if (isCloudflareIP(target)) return "Cloudflare";
        // 2. Static IP prefix database (Imperva, AWS GA, Sucuri, etc.)
        const staticMatch = identifyIPProvider(target);
        if (staticMatch) return staticMatch;
        // 3. PTR fallback (reverse DNS)
        try {
            const parts = target.split(".");
            const ptrName = parts.reverse().join(".") + ".in-addr.arpa";
            const resp = await chrome.runtime.sendMessage({
                command: "dns", 
                payload: { domain: ptrName, type: "PTR" }
            });
            if (resp?.success && resp.data?.Answer?.length > 0) {
                const hostname = (resp.data.Answer[0].data || "").replace(/\.$/, "");
                return identifyHostingProvider(hostname) || null;
            }
        } catch (_) {}
        return null;
    }
    return identifyHostingProvider(target) || null;
}
