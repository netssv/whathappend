/**
 * @module modules/commands/native/pipe-tools.js
 * @description Pipe-aware utility commands: wc (word count) and sort.
 *              Designed to work as pipeline stages receiving stdin.
 *
 * @connections
 * - Imports: ANSI, stripAnsi from '../../formatter.js'
 *            stripAnsi from '../../formatter.js'
 * - Exports: cmdWc, cmdSort
 * - Layer: Command Layer (Native)
 */

import { ANSI, stripAnsi } from "../../formatter.js";

// ---------------------------------------------------------------------------
// wc — word/line/char count
// ---------------------------------------------------------------------------

export function cmdWc(args, flags, opts, stdin) {
    if (!stdin) {
        return `${ANSI.red}bash: wc: missing stdin. Use with a pipe (e.g. command | wc -l)${ANSI.reset}`;
    }

    const lines = String(stdin).split("\n").filter(l => stripAnsi(l).trim() !== "");
    const countLines = flags.includes("-l");
    const countWords = flags.includes("-w");
    const countChars = flags.includes("-c");

    // Default: count lines if no flag given
    const showLines = countLines || (!countWords && !countChars);

    let out = "";
    if (showLines)  out += `${ANSI.cyan}${lines.length}${ANSI.reset} lines`;
    if (countWords) {
        const words = lines.join(" ").split(/\s+/).filter(Boolean).length;
        out += (out ? "  " : "") + `${ANSI.cyan}${words}${ANSI.reset} words`;
    }
    if (countChars) {
        const chars = stripAnsi(lines.join("\n")).length;
        out += (out ? "  " : "") + `${ANSI.cyan}${chars}${ANSI.reset} chars`;
    }

    return out;
}

// ---------------------------------------------------------------------------
// sort — sort lines alphabetically
// ---------------------------------------------------------------------------

export function cmdSort(args, flags, opts, stdin) {
    if (!stdin) {
        return `${ANSI.red}bash: sort: missing stdin. Use with a pipe (e.g. command | sort)${ANSI.reset}`;
    }

    const reverse  = flags.includes("-r");
    const unique   = flags.includes("-u");
    const numeric  = flags.includes("-n");

    let lines = String(stdin).split("\n").filter(l => stripAnsi(l).trim() !== "");

    lines.sort((a, b) => {
        const ca = stripAnsi(a).trim();
        const cb = stripAnsi(b).trim();
        if (numeric) {
            const na = parseFloat(ca) || 0;
            const nb = parseFloat(cb) || 0;
            return na - nb;
        }
        // Use raw codepoint comparison (POSIX C-locale behavior)
        // This ensures consistent ordering: SP < ; < > < [ < a < ─
        return ca < cb ? -1 : ca > cb ? 1 : 0;
    });

    if (reverse) lines.reverse();

    if (unique) {
        const seen = new Set();
        lines = lines.filter(l => {
            const k = stripAnsi(l).trim();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }

    return lines.join("\n");
}
