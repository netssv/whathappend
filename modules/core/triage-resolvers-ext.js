/**
 * @module modules/core/triage-resolvers-ext.js
 * @description Extended triage resolvers for IP/GEO and SSL/CDN rows.
 * 
 * Uses the background DNS handler directly (no cmdDig) for efficiency,
 * and reuses the existing `ssl` background command for certificate +
 * server header data.
 *
 * @connections
 * - Imports: updateIPField, updateGeoField, updateSSLField, updateCDNField
 * - Exports: resolveIPGeoRow, resolveSSLCDNRow, detectCDN, cleanSSLIssuer
 * - Layer: Core Layer (Engine)
 */

import { updateIPField, updateGeoField, updateSSLField, updateCDNField, updateHttpField } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";

const ROW_TIMEOUT = 8000;

// ---------------------------------------------------------------------------
// Row 4: IP + Geo — Background DNS A-record → ipinfo.io geolocation
// ---------------------------------------------------------------------------

export async function resolveIPGeoRow(renderer, originalDomain) {
    if (renderer?.isCancelled()) return;
    try {
        // Use background DNS handler directly (faster, no terminal layer)
        const dnsResp = await raceTimeout(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain: originalDomain, type: "A" } }),
            ROW_TIMEOUT
        );
        if (renderer?.isCancelled()) return;

        const aRecord = dnsResp?.data?.Answer?.find(a => a.type === 1);
        const ip = aRecord?.data;

        if (!ip) { renderer?.updateRow("ip", null); renderer?.updateRow("geo", null); return { ip: null, geo: null, error: true }; }

        // Push IP immediately
        const ipUrl = `https://ipinfo.io/${ip}`;
        renderer?.updateRow("ip", ip, ipUrl);
        updateIPField(ip);
        setSessionTriad("ip", ip);

        // Resolve Geo via ipinfo.io
        try {
            const geoResp = await raceTimeout(
                fetch(`https://ipinfo.io/${ip}/json`).then(r => r.json()),
                ROW_TIMEOUT
            );
            if (renderer?.isCancelled()) return { ip, geo: null };

            if (geoResp?.country) {
                const geoLabel = geoResp.city
                    ? `${geoResp.city}, ${geoResp.country}`
                    : geoResp.country;
                const geoUrl = `https://www.google.com/maps/search/${encodeURIComponent(geoLabel)}`;
                renderer?.updateRow("geo", geoLabel, geoUrl);
                updateGeoField(geoLabel);
                setSessionTriad("geo", geoLabel);
                return { ip, geo: geoLabel };
            }
        } catch (_) {}

        renderer?.updateRow("geo", null);
        return { ip, geo: null, error: true };
    } catch (_) { renderer?.updateRow("ip", null); renderer?.updateRow("geo", null); return { ip: null, geo: null, error: true }; }
}

// ---------------------------------------------------------------------------
// Row 5: SSL + CDN — Certificate issuer + CDN/WAF from server headers
// Reuses the existing `ssl` background command (cert + HEAD in parallel)
// ---------------------------------------------------------------------------

export async function resolveSSLCDNRow(renderer, originalDomain) {
    if (renderer?.isCancelled()) return;
    try {
        const resp = await raceTimeout(
            chrome.runtime.sendMessage({ command: "ssl", payload: { domain: originalDomain } }),
            ROW_TIMEOUT
        );
        if (renderer?.isCancelled()) return;

        let sslLabel = null;
        let cdnLabel = null;

        if (resp?.success && resp.data) {
            // SSL: Calculate days remaining from certificate
            const cert = resp.data.certificate;
            let daysLeft = null;
            
            if (cert?.notAfter && cert.notAfter !== "Unknown") {
                const expiry = new Date(cert.notAfter);
                if (!isNaN(expiry.getTime())) {
                    const now = new Date();
                    daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                }
            }

            if (daysLeft !== null) {
                sslLabel = daysLeft >= 0 ? `Active ${daysLeft}d` : `Expired ${daysLeft}d`;
                const sslUrl = `https://crt.sh/?q=${originalDomain}`;
                renderer?.updateRow("ssl", sslLabel, sslUrl);
                updateSSLField(null, daysLeft);
                setSessionTriad("ssl", sslLabel);
                setSessionTriad("sslDays", daysLeft);
            } else if (cert?.issuer && cert.issuer !== "Unknown") {
                sslLabel = cleanSSLIssuer(cert.issuer);
                const sslUrl = `https://crt.sh/?q=${originalDomain}`;
                renderer?.updateRow("ssl", sslLabel, sslUrl);
                updateSSLField(sslLabel);
                setSessionTriad("ssl", sslLabel);
            } else if (resp.data.connectivity) {
                sslLabel = "Active";
                const sslUrl = `https://crt.sh/?q=${originalDomain}`;
                renderer?.updateRow("ssl", sslLabel, sslUrl);
                updateSSLField(sslLabel);
                setSessionTriad("ssl", sslLabel);
            } else {
                renderer?.updateRow("ssl", null);
            }

            // Extract HTTP Status
            if (resp.data.httpStatus != null) {
                updateHttpField(resp.data.httpStatus, `https://${originalDomain}`);
                setSessionTriad("http", resp.data.httpStatus);
            } else {
                updateHttpField("");
            }

            // CDN / WAF detection from server headers
            const headers = resp.data.serverHeaders || {};
            cdnLabel = detectCDN(headers) || "N/A";
            const cdnUrl = `https://builtwith.com/${originalDomain}`;
            renderer?.updateRow("cdn", cdnLabel, cdnUrl);
            updateCDNField(cdnLabel);
            setSessionTriad("cdn", cdnLabel);
        } else {
            renderer?.updateRow("ssl", null); renderer?.updateRow("cdn", null); return { ssl: null, cdn: null, http: null, error: true };
        }
        
        return { ssl: sslLabel, cdn: cdnLabel, http: resp.data ? resp.data.httpStatus : null, error: false };
    } catch (_) { renderer?.updateRow("ssl", null); renderer?.updateRow("cdn", null); return { ssl: null, cdn: null, http: null, error: true }; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function cleanSSLIssuer(name) {
    if (!name) return "";
    return name
        .replace(/^C=.*?,\s*/i, "")
        .replace(/^O=\s*/i, "")
        .replace(/,?\s*CN=.*$/i, "")
        .replace(/,?\s*Inc\.?$/i, "")
        .replace(/,?\s*LLC$/i, "")
        .replace(/,?\s*Ltd\.?$/i, "")
        .trim() || name;
}

export function detectCDN(headers) {
    const server = (headers["server"] || "").toLowerCase();
    const allVals = Object.values(headers).join(" ").toLowerCase();

    const CDN_SIGS = [
        ["cloudflare", "Cloudflare"], ["akamai", "Akamai"], ["fastly", "Fastly"], ["cloudfront", "CloudFront"],
        ["amazoncf", "CloudFront"], ["vercel", "Vercel"], ["netlify", "Netlify"], ["sucuri", "Sucuri WAF"],
        ["incapsula", "Imperva"], ["imperva", "Imperva"], ["stackpath", "StackPath"], ["keycdn", "KeyCDN"],
        ["bunnycdn", "BunnyCDN"], ["bunny", "BunnyCDN"]
    ];

    for (const [sig, label] of CDN_SIGS) {
        if (server.includes(sig) || allVals.includes(sig)) return label;
    }

    // Server software detection (less specific)
    if (server.includes("nginx")) return "Nginx";
    if (server.includes("apache")) return "Apache";
    if (server.includes("litespeed")) return "LiteSpeed";
    if (server.includes("microsoft") || server.includes("iis")) return "IIS";
    if (server.includes("gws") || server.includes("google")) return "Google";

    return null;
}

function raceTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
}

