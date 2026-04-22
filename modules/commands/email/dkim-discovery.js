// ===================================================================
// DKIM Discovery Engine — Dynamic Inference from MX and SPF
// ===================================================================

const COMMON_SELECTORS = ["default", "s1", "s2", "key1", "key2", "mail"];

const EXCLUDED = ['com', 'net', 'org', 'io', 'co', 'mail', 'smtp', 'pop', 'imap', 'protection', 'spf', 'aspmx', 'mx', 'www', 'app', 'api', 'host'];

/**
 * Infer possible DKIM selectors dynamically based on MX and SPF hosts.
 * @param {string[]} mxData - Array of MX host targets
 * @param {string[]} spfData - Array of domains from SPF 'include:'
 * @returns {string[]} Array of unique selectors to test
 */
export function getPossibleSelectors(mxData = [], spfData = []) {
    const selectors = new Set(COMMON_SELECTORS);
    const combined = [...mxData, ...spfData].filter(Boolean);

    for (let host of combined) {
        const parts = host.toLowerCase().split('.').filter(p => p.length > 2 && !EXCLUDED.includes(p));
        for (const part of parts) {
            selectors.add(part);
            selectors.add(`${part}1`);
        }
        
        // Ensure some known manual fallbacks are added generically if token is matched
        if (host.includes("outlook")) selectors.add("selector1");
        if (host.includes("google")) selectors.add("google");
        if (host.includes("zoho")) selectors.add("zmail");
    }

    return Array.from(selectors);
}
