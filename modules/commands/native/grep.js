/**
 * @module modules/commands/native/grep.js
 * @description Native implementation of grep to filter piped input.
 * 
 * @connections
 * - Imports: ANSI, cmdUsage from '../../formatter.js'
 * - Exports: cmdGrep
 */

import { ANSI, cmdUsage } from "../../formatter.js";
import { stripAnsi } from "../../formatter.js";

export async function cmdGrep(args, flags, opts, stdin) {
    if (!stdin) {
        return `${ANSI.red}bash: grep: missing stdin. Use with a pipe (e.g. command | grep pattern)${ANSI.reset}`;
    }

    if (args.length === 0) {
        return cmdUsage("grep", "<pattern>");
    }

    const pattern = args[0];
    const ignoreCase = flags.includes("-i");
    const invertMatch = flags.includes("-v");

    const lines = typeof stdin === "string" ? stdin.split('\n') : String(stdin).split('\n');
    let matchedLines = [];

    for (let line of lines) {
        const cleanLine = stripAnsi(line);
        let matches = ignoreCase 
            ? cleanLine.toLowerCase().includes(pattern.toLowerCase())
            : cleanLine.includes(pattern);

        if (invertMatch) matches = !matches;

        if (matches) {
            // Re-apply a simple ANSI highlight to the matching part if not inverted
            if (!invertMatch && cleanLine.length > 0) {
                // simple highlight logic preserving existing ANSI is tricky,
                // so we just return the line (this is a basic POC).
                matchedLines.push(line);
            } else {
                matchedLines.push(line);
            }
        }
    }

    return matchedLines.join('\n');
}
