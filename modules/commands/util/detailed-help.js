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
 * - Imports: NETWORK_HELP from './detailed-help-network.js'
 * - Imports: TOOLS_HELP from './detailed-help-tools.js'
 * - Imports: EMULATION_HELP from './detailed-help-emulation.js'
 * - Exports: formatHelp, sh, cmdDetailedHelp
 * - Layer: Command Layer (Util) — assembler / dispatcher.
 */

import { ANSI } from "../../formatter.js";
import { CMD_ALIASES } from "../../data/aliases.js";
import { getTermCols } from "../../state.js";

// ── Shared Rendering Utilities ────────────────────────────────────────
// Exported so sub-modules can import them without circular deps.

export function formatHelp({ name, syntax, descLines = [], aliases = null, examples = [] }) {
    const cols = getTermCols();
    const sepLen = Math.min(60, Math.max(30, cols - 4));
    const sep = ANSI.dim + "─".repeat(sepLen) + ANSI.reset;

    let out = `  ${ANSI.bgWhite}${ANSI.black} COMMAND ${ANSI.reset} ${ANSI.bold}${ANSI.cyan}${name}${ANSI.reset}\n`;
    out += `  ${sep}\n\n`;

    out += `  ${ANSI.bold}${ANSI.white}DESCRIPTION${ANSI.reset}\n`;
    for (const line of descLines) out += `    ${line}\n`;
    out += `\n`;

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
            if (ex.desc) out += `\n      ${ANSI.dim}↳ ${ex.desc}${ANSI.reset}`;
            out += `\n\n`;
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
    const [dns, web, sec, net, perf, tools, misc, emu] = await Promise.all([
        import("./detailed-help-dns.js"),
        import("./detailed-help-web.js"),
        import("./detailed-help-security.js"),
        import("./detailed-help-network.js"),
        import("./detailed-help-perf.js"),
        import("./detailed-help-tools.js"),
        import("./detailed-help-misc.js"),
        import("./detailed-help-emulation.js"),
    ]);
    return {
        ...dns.DNS_HELP,
        ...web.WEB_HELP,
        ...sec.SECURITY_HELP,
        ...net.NETWORK_HELP,
        ...perf.PERF_HELP,
        ...tools.TOOLS_HELP,
        ...misc.MISC_HELP,
        ...emu.EMULATION_HELP,
    };
}

// Cache to avoid repeated dynamic imports.
let _cache = null;

// ── Public Dispatcher ─────────────────────────────────────────────────

export async function cmdDetailedHelp(cmd, suggestCommand) {
    const resolved = CMD_ALIASES[cmd] || cmd;
    if (!_cache) _cache = await getHelp();
    if (_cache[resolved]) return _cache[resolved]();
    const suggestion = suggestCommand(cmd);
    if (suggestion) return `\n  ${ANSI.dim}No help for '${cmd}'.${ANSI.reset} ${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}\n  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
    return `\n  ${ANSI.dim}No help for '${cmd}'. Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
}
