/**
 * @module modules/commands/util/search-engine.js
 * @description Fuzzy search engine for finding commands across all help sections.
 *              Extracted from search-ui.js for modularity.
 */

import { HELP_SECTIONS } from "../../data/help-data.js";

/**
 * Fuzzy-match: checks if all characters in `query` appear in `target` in order.
 * Also handles exact word matches in name, desc, or aliases.
 */
function matchScore(query, name, desc, aliases) {
    const q = query.toLowerCase();
    const n = name.toLowerCase();
    const d = (desc || "").toLowerCase();
    const a = (aliases || "").toLowerCase();

    // Exact substring match in name or aliases = highest priority
    if (n.includes(q)) return 3;
    if (a.includes(q)) return 2;
    if (d.includes(q)) return 1;

    // Fuzzy: all chars of query appear in name in order
    let pos = 0;
    for (const ch of q) {
        const idx = n.indexOf(ch, pos);
        if (idx === -1) return 0;
        pos = idx + 1;
    }
    return 0.5;
}

/**
 * Search across ALL help sections for commands matching the query.
 * Returns array of { cmd, desc, aliases, section } sorted by score.
 */
export function searchCommands(query) {
    if (!query || query.length < 1) return [];
    const results = [];
    for (const sec of HELP_SECTIONS) {
        for (const [name, desc, aliases] of sec.cmds) {
            const score = matchScore(query, name, desc, aliases);
            if (score > 0) {
                results.push({ cmd: name, desc, aliases: aliases || "", section: sec.title, score });
            }
        }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 18);
}
