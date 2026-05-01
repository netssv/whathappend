/**
 * @module modules/engine.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, generateImpactSection, isIPAddress, resolveTargetDomain, cmdUsage, cmdError, workerError from './formatter.js'
 *     - CMD_ALIASES, DNS_SHORTCUTS from './data/aliases.js'
 *     - parseCommand, suggestCommand from './core/parser.js'
 *     - checkTargetGuards from './core/guards.js'
 *     - handleAutoTarget from './core/fallback.js'
 *     - COMMAND_REGISTRY from './core/registry.js'
 * - Exports: executeCommand
 * - Layer: Shared Utility / Router - Common functions or central engine index used across the app.
 */

/**
 * WhatHappened — Command Engine (Router)
 *
 * Every command follows a strict 3-part output:
 *   1. RAW — authentic data (short for shortcuts, verbose for dig)
 *   2. EXPLAIN — dim gray note on what was executed
 *   3. INSIGHTS — colored actionable findings
 */

import { ANSI, generateImpactSection, isIPAddress, resolveTargetDomain, cmdError } from "./formatter.js";
import { CMD_ALIASES, DNS_SHORTCUTS } from "./data/aliases.js";

// Core logic modules
import { parseCommand, suggestCommand } from "./core/parser.js";
import { checkTargetGuards } from "./core/guards.js";
import { handleAutoTarget } from "./core/fallback.js";
import { COMMAND_REGISTRY } from "./core/registry.js";

// Direct imports needed for engine internals
import { cmdDig } from "./commands/dns/index.js";
import { cmdHelp, cmdDetailedHelp, cmdSwitch, cmdStart } from "./commands/util/index.js";

// ---------------------------------------------------------------------------
// Public API — executeCommand
// ---------------------------------------------------------------------------

export async function executeCommand(input) {
    const trimmed = input.trim().replace(/\\+$/, "").trim();
    if (!trimmed) return "";
    if (trimmed === "?") return cmdHelp();
    if (trimmed.endsWith("?")) {
        const target = trimmed.replace(/\s*\?\s*$/, "").trim().toLowerCase();
        if (target) return cmdDetailedHelp(target, suggestCommand);
        return cmdHelp();
    }

    const { cmd, args, flags, opts } = parseCommand(trimmed);
    const hasImpact = flags.includes("--impact");
    let output = "";

    const resolved = CMD_ALIASES[cmd] || cmd;

    // ── Contextual Intelligence: IP vs. Domain Guards ──
    const targetArg = args[0] || resolveTargetDomain(null);
    const targetIsIP = isIPAddress(targetArg);

    const guardViolation = await checkTargetGuards(resolved, targetArg, targetIsIP);
    if (guardViolation) return guardViolation;

    try {
        if (DNS_SHORTCUTS[resolved]) {
            output = await cmdDig(args, { forcedType: DNS_SHORTCUTS[resolved], opts, isShortcut: true });
        } else {
            if (resolved === "clear") return "__CLEAR__";

            if (resolved === "switch") {
                const result = await cmdSwitch();
                if (result && typeof result === "object" && result.__switch) {
                    // Re-enter engine with the domain — triggers handleAutoTarget
                    return await executeCommand(result.domain);
                }
                output = result;
            } else if (resolved === "start") {
                const result = await cmdStart(args);
                if (result && typeof result === "object" && result.__switch) {
                    return await executeCommand(result.domain);
                }
                output = result;
            } else if (COMMAND_REGISTRY[resolved]) {
                output = await COMMAND_REGISTRY[resolved](args, flags, opts);
            } else {
                // If not a known command, check if it's an auto-target domain/IP
                output = await handleAutoTarget(cmd, args, opts, flags);
                // Progressive triage returns an object — pass through directly
                if (output && typeof output === "object" && output.backgroundTriage !== undefined) {
                    return output;
                }
            }
        }
    } catch (err) {
        output = cmdError(` ${err.message || "Unknown error occurred"}`);
        output += `\n${ANSI.dim}If this persists, try a different domain or check your connection.${ANSI.reset}`;
    }

    if (output && typeof output === "object" && output.__watch) {
        return output;
    }

    if (hasImpact && !["help","clear","target"].includes(resolved)) {
        try {
            const ic = DNS_SHORTCUTS[resolved] ? "dig" : resolved;
            const imp = await generateImpactSection(ic, output);
            if (imp) output += "\n\n" + imp;
        } catch (_) { /* impact is non-critical, silently skip */ }
    }
    return output;
}
