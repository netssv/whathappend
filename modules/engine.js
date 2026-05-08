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
import { parsePipeline, suggestCommand } from "./core/parser.js";
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

    const pipeline = parsePipeline(trimmed);
    let currentOutput = "";
    let currentStdin = null;

    for (let i = 0; i < pipeline.length; i++) {
        const node = pipeline[i];
        
        // Execute single node
        const nodeResult = await executeSingleNode(node, currentStdin);
        
        // If it's a special object (switch, clear, triage watcher), return immediately
        if (nodeResult === "__CLEAR__") return nodeResult;
        if (nodeResult && typeof nodeResult === "object") {
            if (nodeResult.__switch) return await executeCommand(nodeResult.domain);
            if (nodeResult.backgroundTriage !== undefined || nodeResult.__watch) {
                return nodeResult;
            }
        }
        
        // Extract string output for the next pipe.
        // For non-terminal stages, strip cosmetic lines (command echo, INSIGHTS)
        // so only raw data flows — mirrors real Linux pipe behavior.
        currentOutput = nodeResult;
        const isLastNode = i === pipeline.length - 1;
        const raw = typeof nodeResult === "string" ? nodeResult : (nodeResult?.output || "");
        currentStdin = isLastNode ? raw : cleanForPipe(raw);
    }

    // Only apply impact on the first command's resolution (for backwards compatibility)
    const { cmd, flags } = pipeline[0];
    const hasImpact = flags.includes("--impact");
    let resolved = CMD_ALIASES[cmd] || cmd;
    if (resolved.includes(" ")) resolved = resolved.split(" ")[0];

    if (hasImpact && !["help","clear","target"].includes(resolved) && typeof currentOutput === "string") {
        try {
            const ic = DNS_SHORTCUTS[resolved] ? "dig" : resolved;
            const imp = await generateImpactSection(ic, currentOutput);
            if (imp) currentOutput += "\n\n" + imp;
        } catch (_) { /* impact is non-critical, silently skip */ }
    }

    return currentOutput;
}

async function executeSingleNode({ cmd, args, flags, opts }, stdin) {
    let output = "";
    let resolved = CMD_ALIASES[cmd] || cmd;
    
    if (resolved.includes(" ")) {
        const parts = resolved.split(" ");
        resolved = parts[0];
        flags.push(...parts.slice(1));
    }

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
            if (resolved === "switch") return await cmdSwitch();
            if (resolved === "start") return await cmdStart(args);
            
            if (COMMAND_REGISTRY[resolved]) {
                // Pass stdin as a 4th parameter for pipeline support
                output = await COMMAND_REGISTRY[resolved](args, flags, opts, stdin);
            } else {
                // If not a known command, check if it's an auto-target domain/IP
                output = await handleAutoTarget(cmd, args, opts, flags);
            }
        }
    } catch (err) {
        output = cmdError(`bash: ${cmd}: ${err.message || "command not found"}`);
        output += `\n${ANSI.dim}If this persists, try a different domain or check your connection.${ANSI.reset}`;
    }

    return output;
}

// ---------------------------------------------------------------------------
// Pipe stdin sanitizer — strips cosmetic/display-only lines
// ---------------------------------------------------------------------------

/**
 * Remove terminal-display lines that should not flow through a pipe.
 * In real Linux, `dig +short` stdout only contains raw answers.
 * Our commands include echoes and INSIGHTS for readability — these must
 * be stripped when the output is used as stdin for the next command.
 *
 * Stripped patterns:
 *   - Command echo:   "> dig ..." / "> curl ..."
 *   - INSIGHTS header: "── INSIGHTS ──"
 *   - Insight entries: "[INFO] ..." / "[WARN] ..." / "[PASS] ..." / "[CRIT] ..."
 */
function cleanForPipe(output) {
    if (!output) return "";
    return output
        .split("\n")
        .filter(line => {
            // Strip ANSI codes for the check, keep original line in output
            const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim();
            if (!clean) return false;
            if (clean.startsWith(">")) return false;           // command echo
            if (clean.startsWith("──") || clean.startsWith("--")) return false; // INSIGHTS separator
            if (/^\[(INFO|WARN|PASS|CRIT|FAIL|ERROR)\]/.test(clean)) return false; // insights
            return true;
        })
        .join("\n");
}
