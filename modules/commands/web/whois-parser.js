// ===================================================================
// WHOIS Parser — Heuristic-based, provider-agnostic
//
// Pure extraction engine. No network logic, no UI concerns.
// Receives RDAP JSON and returns clean structured data.
// ===================================================================

// Prioritized regex patterns for scanning raw text in RDAP descriptions
const REGISTRAR_PATTERNS = [
    /Registrar\s*Name\s*:\s*(.+)/i,
    /Sponsoring\s+Registrar\s*:\s*(.+)/i,
    /Registrar\s*:\s*(.+)/i,
    /Registrar\s+URL\s*:\s*(https?:\/\/[^\s]+)/i,
];

// Corporate suffixes to strip during normalization
const CORP_SUFFIXES = /[,.]?\s*(?:LLC|L\.L\.C|Inc\.?|INC|Corp\.?|CORP|Ltd\.?|LTD|GmbH|S\.?A\.?|S\.?L\.?|B\.?V\.?|Pty|Limited|International|Group|Holdings|Technologies|Technology|Solutions|Services|Domains|Registrar)\.?\s*$/gi;

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export function normalize(raw) {
    if (!raw) return "Unknown";
    let n = raw.trim();

    // URL → extract hostname
    if (/^https?:\/\//.test(n)) {
        try { n = new URL(n).hostname.replace(/^www\./, ""); } catch (_) {}
    }

    n = n.replace(/[,.\s]+$/, "").trim();
    if (n.length > 35) n = n.slice(0, 32) + "...";
    return n || "Unknown";
}

// ---------------------------------------------------------------------------
// vCard Entity Search
// ---------------------------------------------------------------------------

/** Search entities recursively for a vCard "fn" field matching a role. */
function findVCardName(entities, role) {
    if (!entities?.length) return null;
    for (const e of entities) {
        if (!e.roles?.includes(role)) {
            if (e.entities?.length) {
                const nested = findVCardName(e.entities, role);
                if (nested) return nested;
            }
            continue;
        }
        // Found matching role — extract fn
        if (e.vcardArray?.[1]) {
            for (const p of e.vcardArray[1]) {
                if (p[0] === "fn" && p[3]) return p[3];
            }
        }
        // Fallback: publicIds identifier
        if (e.publicIds?.length) {
            for (const pid of e.publicIds) {
                if (pid.identifier) return pid.identifier;
            }
        }
        if (e.handle) return e.handle;
    }
    return null;
}

// ---------------------------------------------------------------------------
// Text Source Collection
// ---------------------------------------------------------------------------

/** Collect all description text lines from RDAP remarks, notices, and entities. */
function collectTextSources(rdap) {
    const lines = [];
    for (const arr of [rdap?.remarks, rdap?.notices]) {
        if (!arr?.length) continue;
        for (const r of arr) {
            if (r.description?.length) lines.push(...r.description);
        }
    }
    if (rdap?.entities?.length) {
        for (const e of rdap.entities) {
            if (!e.remarks?.length) continue;
            for (const r of e.remarks) {
                if (r.description?.length) lines.push(...r.description);
            }
        }
    }
    return lines;
}

// ---------------------------------------------------------------------------
// Heuristic Registrar Extraction
// ---------------------------------------------------------------------------

/**
 * Extract registrar name from RDAP response using heuristic strategies.
 * 100% provider-agnostic — no hardcoded maps.
 *
 * Priority:
 *   1. vCard "fn" on registrar → registrant entities
 *   2. Regex scan of remarks/notices description arrays
 *   3. Cleaned port43 hostname as last resort
 *
 * @param {Object} rdap - Full RDAP response object
 * @returns {string} Normalized registrar name
 */
export function extractRegistrar(rdap) {
    if (!rdap) return "Unknown";
    const ent = findVCardName(rdap.entities, "registrar") || findVCardName(rdap.entities, "registrant");
    if (ent) return normalize(ent);
    for (const p of REGISTRAR_PATTERNS) {
        for (const l of collectTextSources(rdap)) {
            const m = l.match(p);
            if (m?.[1] && m[1].trim().length > 1 && m[1].trim() !== "N/A") return normalize(m[1].trim());
        }
    }
    if (rdap.port43) {
        const c = rdap.port43.toLowerCase().replace(/^whois\./, "").replace(/\.(com|net|org|io)$/, "");
        if (c && c !== rdap.port43.toLowerCase()) return normalize(c);
    }
    return "Unknown";
}

// ---------------------------------------------------------------------------
// Expiry & Age Extraction
// ---------------------------------------------------------------------------

/** Extract expiry date (ISO string, sliced to YYYY-MM-DD) from RDAP events. */
export function extractExpiry(rdap) {
    const ev = rdap?.events?.find(e => e.eventAction === "expiration");
    return ev?.eventDate?.slice(0, 10) || null;
}

/** Extract registration date from RDAP events. */
export function extractRegistration(rdap) {
    const ev = rdap?.events?.find(e => e.eventAction === "registration");
    return ev?.eventDate || null;
}

/**
 * Parse RDAP response into a clean, structured JSON.
 * Designed for consumption by the background worker and terminal header.
 * @param {Object} rdap - Full RDAP response
 * @returns {Object} { registrar, expiry, registration }
 */
export function parseWhoisSummary(rdap) {
    return {
        registrar: extractRegistrar(rdap),
        expiry:    extractExpiry(rdap),
        registration: extractRegistration(rdap),
    };
}
