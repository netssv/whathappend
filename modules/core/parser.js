import { ALL_KNOWN_CMDS } from "../data/aliases.js";

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
    for (const name of ALL_KNOWN_CMDS) {
        const d = levenshtein(input, name);
        if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Command Parser
// ---------------------------------------------------------------------------

export function parseCommand(input) {
    const tokens = input.split(/\s+/);
    const flags = tokens.filter(t => t.startsWith("--"));
    const opts = tokens.filter(t => t.startsWith("+"));
    const nf = tokens.filter(t => !t.startsWith("--") && !t.startsWith("+"));
    return { cmd: nf[0]?.toLowerCase()||"", args: nf.slice(1), flags, opts };
}
