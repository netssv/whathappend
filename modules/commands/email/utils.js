// ---------------------------------------------------------------------------
// DKIM Database Loader & Helpers
// ---------------------------------------------------------------------------

let _dkimDB = null;

export async function loadDKIMDB() {
    if (_dkimDB) return _dkimDB;
    try {
        const r = await fetch(chrome.runtime.getURL("data/dkim-selectors.json"));
        _dkimDB = await r.json();
        return _dkimDB;
    } catch (_) {
        return { selectors: [], cname_patterns: {} };
    }
}

export function getAllDKIMSelectors(db) {
    const all = new Set();
    for (const p of db.selectors) for (const s of p.selectors) all.add(s);
    return [...all];
}

export function identifyDKIMProvider(selector, db) {
    for (const p of db.selectors) {
        if (p.selectors.includes(selector)) return p.provider;
    }
    return null;
}

// Helper: normalize TXT record data from Google DoH
// Strips escaped quotes, backslashes, and trims whitespace
export function normTxt(r) {
    return (r.data || "").replace(/\\"|\\|"/g, "").trim();
}
