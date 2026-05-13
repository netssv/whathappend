/**
 * @module modules/core/parser.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ALL_KNOWN_CMDS from '../data/aliases.js'
 * - Exports: levenshtein, suggestCommand, parseCommand
 * - Layer: Core Layer (Engine) - Central triaging, parsing, and execution routing.
 */

import { AVAILABLE_COMMANDS } from "../data/autocomplete-data.js";

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

export function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_,i) => Array.from({length: n+1}, (_,j) => i||j));
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
        dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]!==b[j-1]?1:0));
    return dp[m][n];
}

export function suggestCommand(input) {
    if (input.length <= 1) return null;
    const maxDist = input.length <= 3 ? 2 : 3;
    let best = null, bestDist = maxDist;
    for (const name of AVAILABLE_COMMANDS) {
        const d = levenshtein(input, name);
        if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Command Parser
// ---------------------------------------------------------------------------

export function parsePipeline(input) {
    // 1. Split by pipes respecting quotes
    const pipeline = [];
    const regex = /("[^"]*"|'[^']*'|[^|]+)/g;
    const parts = (input.match(regex) || []).map(p => p.trim()).filter(Boolean);
    
    // Sometimes the regex leaves trailing/leading spaces or splits weirdly if pipes are mixed
    // A more robust pipe splitter:
    let currentPart = "";
    let inQuotes = false;
    let quoteChar = "";
    const commands = [];
    
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if ((char === '"' || char === "'") && (i === 0 || input[i-1] !== '\\')) {
            if (inQuotes && quoteChar === char) {
                inQuotes = false;
            } else if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            }
            currentPart += char;
        } else if (char === '|' && !inQuotes) {
            commands.push(currentPart.trim());
            currentPart = "";
        } else {
            currentPart += char;
        }
    }
    if (currentPart) commands.push(currentPart.trim());

    return commands.map(cmd => parseCommandNode(cmd));
}

function parseCommandNode(input) {
    const tokens = [];
    let currentToken = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if ((char === '"' || char === "'") && (i === 0 || input[i-1] !== '\\')) {
            if (inQuotes && quoteChar === char) {
                inQuotes = false;
                // keep quotes out of the final token value if desired, but here we just leave them or strip them
            } else if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            }
        } else if (char === ' ' && !inQuotes) {
            if (currentToken) {
                tokens.push(currentToken);
                currentToken = "";
            }
        } else {
            currentToken += char;
        }
    }
    if (currentToken) tokens.push(currentToken);

    const flags = [];
    const opts = [];
    const args = [];

    for (const t of tokens) {
        if (t.startsWith("--")) {
            flags.push(t); // Long flag
        } else if (t.startsWith("-") && t !== "-") {
            const noSplit = new Set(["-cwv", "-ip", "-myip", "-whois", "-registrar", "-hosting", "-ssl", "-cert", "-headers", "-stack", "-wappalyzer", "-vitals", "-persist", "-keepalive", "-close", "-list", "-info", "-diag", "-watch", "-block", "-sleep", "-focus", "-flush", "-stop"]);
            if (noSplit.has(t) || t.length > 4) {
                // Keep known Linux-style long flags intact instead of fragmenting them
                flags.push(t);
            } else {
                // Short flags expansion (e.g. -la -> -l, -a)
                for (let i = 1; i < t.length; i++) {
                    flags.push("-" + t[i]);
                }
            }
        } else if (t.startsWith("+")) {
            opts.push(t);
        } else {
            args.push(t.replace(/^["']|["']$/g, "")); // strip outer quotes
        }
    }

    return { cmd: args[0]?.toLowerCase() || "", args: args.slice(1), flags, opts };
}

// For backwards compatibility, parseCommand returns the first node
export function parseCommand(input) {
    return parsePipeline(input)[0];
}
