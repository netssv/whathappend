/**
 * @module modules/commands/util/detailed-help.js
 * @description Assembler and dispatcher for the per-command detailed help system.
 *              Provides the shared formatHelp and sh() utilities, then merges
 *              all category sub-modules into a single lookup table.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js'
 * - Imports: CMD_ALIASES from '../../data/aliases.js'
 * - Imports: getTermCols from '../../state.js'
 * - Imports: DNS_HELP from './detailed-help-dns.js'
 * - Imports: WEB_HELP from './detailed-help-web.js'
 * - Imports: DOM_HELP from './detailed-help-dom.js'
 * - Imports: SECURITY_HELP from './detailed-help-security.js'
 * - Imports: NETWORK_HELP from './detailed-help-network.js'
 * - Imports: PERF_HELP from './detailed-help-perf.js'
 * - Imports: TOOLS_HELP from './detailed-help-tools.js'
 * - Imports: REPORTING_HELP from './detailed-help-reporting.js'
 * - Imports: MISC_HELP from './detailed-help-misc.js'
 * - Imports: EMULATION_HELP from './detailed-help-emulation.js'
 * - Exports: formatHelp, sh, cmdDetailedHelp
 * - Layer: Command Layer (Util) — assembler / dispatcher.
 */

import { ANSI } from "../../formatter.js";
import { CMD_ALIASES } from "../../data/aliases.js";
import { getTermCols } from "../../state.js";

/**
 * Word-wrap a pre-indented string to maxWidth, preserving the original
 * leading whitespace on continuation lines (+ 2 extra spaces).
 * Blank lines ("") are passed through unchanged.
 */
function wordWrap(text, maxWidth) {
    if (!text || text.length <= maxWidth) return text;
    const lead  = text.match(/^(\s*)/)[1];   // original indent (preserved on every line)
    const words = text.trimStart().split(" ");
    const lines = [];
    let cur = lead;
    for (const w of words) {
        if (cur === lead) {
            cur += w;
        } else if (cur.length + 1 + w.length <= maxWidth) {
            cur += " " + w;
        } else {
            lines.push(cur);
            cur = lead + w;                  // same indent — no extra nesting
        }
    }
    if (cur) lines.push(cur);
    return lines.join("\n");
}

export function formatHelp({ name, syntax, descLines = [], aliases = null, examples = [] }) {
    const cols   = getTermCols() || 80;
    const maxW   = Math.max(20, cols - 2);           // usable terminal width (min 20)
    const sepLen = Math.min(60, Math.max(30, cols - 4));
    const sep    = ANSI.dim + "─".repeat(sepLen) + ANSI.reset;
    const wrap   = (line) => wordWrap("    " + line, maxW); // 4-space prefix

    let out = `  ${ANSI.bgWhite}${ANSI.black} COMMAND ${ANSI.reset} ${ANSI.bold}${ANSI.cyan}${name}${ANSI.reset}\n`;
    out += `  ${sep}\n\n`;

    out += `  ${ANSI.bold}${ANSI.white}DESCRIPTION${ANSI.reset}\n`;
    for (const line of descLines) {
        const t = line.trim();
        if (t === "WHAT IS IT?" || t === "REAL USE CASES:" || t === "FLAGS:") {
            out += `\n  ${ANSI.bold}${ANSI.white}${t}${ANSI.reset}\n`;
        } else {
            out += wrap(line) + "\n";
        }
    }
    out += "\n";

    out += `  ${ANSI.bold}${ANSI.white}SYNTAX${ANSI.reset}\n`;
    out += `    ${ANSI.green}${name}${ANSI.reset} ${ANSI.dim}${syntax}${ANSI.reset}\n\n`;

    if (aliases) {
        out += `  ${ANSI.bold}${ANSI.white}ALIASES${ANSI.reset}\n`;
        out += `    ${ANSI.dim}${aliases}${ANSI.reset}\n\n`;
    }

    if (examples && examples.length > 0) {
        out += `  ${ANSI.bold}${ANSI.white}EXAMPLES & USE CASES${ANSI.reset}\n`;
        for (const ex of examples) {
            out += `    ${ANSI.yellow}❯${ANSI.reset} ${ANSI.cyan}${ex.cmd}${ANSI.reset}`;
            if (ex.desc) out += `\n${ANSI.dim}${wordWrap("      ↳ " + ex.desc, maxW)}${ANSI.reset}`;
            out += "\n\n";
        }
    }

    out += `  ${sep}\n`;
    return out;
}


/** Shortcut for single-record DNS commands (a, aaaa, mx, txt, ns, cname). */
export function sh(cmd, type, desc) {
    return formatHelp({
        name: cmd, syntax: "[domain]",
        descLines: [`Shortcut: dig <domain> ${type} (short)`, desc],
        aliases: null,
        examples: [{ cmd: `${cmd} example.com` }, { cmd: `${cmd}`, desc: "(active tab)" }],
    });
}

// ── Lazy-loaded category maps ─────────────────────────────────────────
// Sub-modules import { formatHelp, sh } from this file, so they must be
// imported AFTER formatHelp and sh are defined (below, not at the top).

async function getHelp() {
    const [dns, web, dom, sec, net, perf, tools, rep, misc, emu] = await Promise.all([
        import("./detailed-help-dns.js"),
        import("./detailed-help-web.js"),
        import("./detailed-help-dom.js"),
        import("./detailed-help-security.js"),
        import("./detailed-help-network.js"),
        import("./detailed-help-perf.js"),
        import("./detailed-help-tools.js"),
        import("./detailed-help-reporting.js"),
        import("./detailed-help-misc.js"),
        import("./detailed-help-emulation.js"),
    ]);
    return {
        ...dns.DNS_HELP,
        ...web.WEB_HELP,
        ...dom.DOM_HELP,
        ...sec.SECURITY_HELP,
        ...net.NETWORK_HELP,
        ...perf.PERF_HELP,
        ...tools.TOOLS_HELP,
        ...rep.REPORTING_HELP,
        ...misc.MISC_HELP,
        ...emu.EMULATION_HELP,
    };
}

// Cache to avoid repeated dynamic imports.
let _cache = null;

// ── Public Dispatcher ─────────────────────────────────────────────────

export async function cmdDetailedHelp(cmd, suggestCommand) {
    if (!_cache) _cache = await getHelp();

    // Step 1 — exact match on raw input ("seo", "exit", "ip-spoof")
    if (_cache[cmd]) return _cache[cmd]();

    // Step 2 — try flag from RAW input ("dns -a" → flag "a", "tabs -list" → "tabs")
    const rawParts = cmd.split(" ");
    if (rawParts.length > 1) {
        const rawFlag = rawParts[1].replace(/^-+/, ""); // strip leading dashes
        // Try flag as standalone key ("a", "mx", "list" → falls through to base)
        if (_cache[rawFlag])       return _cache[rawFlag]();
        // Try base of raw input ("dns", "tabs", "sudo", "help")
        if (_cache[rawParts[0]])   return _cache[rawParts[0]]();
    }

    // Step 3 — resolve through alias table (may produce compound: "web -seo")
    const aliased = CMD_ALIASES[cmd] || cmd;
    const parts   = aliased.split(" ");

    // Step 4 — if aliased is compound, try its flag as a standalone key
    if (parts.length > 1) {
        const flag = parts[1].replace(/^-+/, "");
        if (_cache[flag]) return _cache[flag]();
    }

    // Step 5 — fall back to the base of the resolved alias ("web -seo" → "web")
    const base = parts[0];
    if (_cache[base]) return _cache[base]();

    const suggestion = suggestCommand(cmd);
    if (suggestion) return `\n  ${ANSI.dim}No help for '${cmd}'.${ANSI.reset} ${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}\n  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
    return `\n  ${ANSI.dim}No help for '${cmd}'. Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
}
