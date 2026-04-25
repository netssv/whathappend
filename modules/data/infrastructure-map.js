// ===================================================================
// Infrastructure Map — Corporate Affiliation Database
//
// Maps known hosting/registrar companies to their parent corporate
// group. Used to detect "Consolidated Stack" when the registrar and
// host belong to the same corporate family (e.g., Hostopia and
// Internet Names For Business → both Deluxe Corporation).
//
// LOCAL ONLY — No external lookups. Static data embedded in source.
// ===================================================================

/**
 * Corporate groups mapped to known brand/subsidiary names.
 * Keys are internal group IDs. Values are arrays of lowercase
 * substrings that identify a provider as part of that group.
 */
const CORPORATE_GROUPS = {
    deluxe:      ["hostopia", "internet names for business", "aplus.net", "deluxe"],
    godaddy:     ["godaddy", "domains by proxy", "wild west domains"],
    cloudflare:  ["cloudflare", "cf-dns", "cloudflare-dns", "cloudflare cdn"],
    amazon:      ["amazon", "aws", "route 53", "route53", "ec2", "s3", "cloudfront"],
    google:      ["google", "alphabet", "gcp", "cloud dns"],
    meta:        ["meta platforms", "facebook"],
    microsoft:   ["microsoft", "azure", "hotmail", "outlook"],
    namecheap:   ["namecheap"],
    tucows:      ["tucows", "hover", "enom", "opensrs"],
    endurance:   ["endurance", "bluehost", "hostgator", "justhost", "hostmonster"],
    newfold:     ["newfold", "web.com", "network solutions", "register.com", "domain.com"],
    ionos:       ["ionos", "1&1", "united internet", "1and1"],
    ovh:         ["ovh", "ovhcloud"],
    hetzner:     ["hetzner"],
    digitalocean:["digitalocean"],
    automattic:  ["automattic", "wordpress.com"],
    squarespace: ["squarespace"],
    wix:         ["wix"],
    shopify:     ["shopify"],
    netlify:     ["netlify"],
    vercel:      ["vercel"],
    fastly:      ["fastly"],
    akamai:      ["akamai", "linode"],
    oracle:      ["oracle", "dyn"],
    verisign:    ["verisign"],
    donuts:      ["donuts", "identity digital"],
    cscglobal:   ["csc global", "corporation service"],
    markmonitor: ["markmonitor"],
    imperva:     ["imperva", "incapsula"],
    sucuri:      ["sucuri", "godaddy security"],
    stackpath:   ["stackpath", "highwinds", "maxcdn"],
    leaseweb:    ["leaseweb"],
    rackspace:   ["rackspace"],
    vultr:       ["vultr"],
    siteground:  ["siteground"],
    dreamhost:   ["dreamhost"],
    hostinger:   ["hostinger"],
    wpengine:    ["wp engine", "wpengine"],
    kinsta:      ["kinsta"],
    pagely:      ["pagely"],
    pantheon:    ["pantheon"],
    flywheel:    ["flywheel"],
};

/**
 * Find the corporate group ID for a given provider name.
 * @param {string} provider — provider name from RDAP/WHOIS
 * @returns {string|null} group ID or null if not recognized
 */
function findGroup(provider) {
    if (!provider) return null;
    const lower = provider.toLowerCase();
    for (const [groupId, keywords] of Object.entries(CORPORATE_GROUPS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return groupId;
        }
    }
    return null;
}

/**
 * Determine if two or more providers belong to the same corporate family.
 * Returns the group ID if all recognized providers share a group, or null.
 *
 * @param {string[]} providers — array of provider names (may contain nulls)
 * @returns {{ consolidated: boolean, groupId: string|null }}
 */
export function classifyInfrastructure(providers) {
    if (!providers || providers.length < 2) {
        return { consolidated: false, groupId: null };
    }

    const groups = providers
        .filter(Boolean)
        .map(p => ({ name: p, group: findGroup(p) }));

    // Filter out unrecognized providers
    const recognized = groups.filter(g => g.group !== null);

    if (recognized.length < 2) {
        // Fallback: exact string match (case-insensitive)
        const normalized = providers.filter(Boolean).map(p => p.toLowerCase().trim());
        const allSame = normalized.every(n => n === normalized[0]);
        return { consolidated: allSame, groupId: allSame ? normalized[0] : null };
    }

    // Check if all recognized providers share the same group
    const firstGroup = recognized[0].group;
    const allSameGroup = recognized.every(g => g.group === firstGroup);

    return {
        consolidated: allSameGroup,
        groupId: allSameGroup ? firstGroup : null,
    };
}
