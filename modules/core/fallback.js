import { ANSI, isIPAddress, toApex, cmdError, getSeparator } from "../formatter.js";
import { REGEX } from "../data/constants.js";
import { DNS_TYPES } from "../data/aliases.js";
import { ContextManager } from "../context.js";
import { cmdDig } from "../commands/dns/index.js";
import { cmdRevDNS } from "../commands/native/index.js";
import { suggestCommand } from "./parser.js";
import { resolveRegistrarRow, resolveNSRow, resolveWebHostRow } from "./triage-resolvers.js";
import { term } from "../terminal/terminal-ui.js";
import { ProgressiveRenderer } from "../terminal/progressive-renderer.js";
import { buildTriageHistory } from "../terminal/triage-history.js";

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _activeRenderer = null;

// ---------------------------------------------------------------------------
// Aggressive Apex Normalization
// ---------------------------------------------------------------------------

/**
 * Sanitize raw user input into a clean domain for DNS queries.
 * Strips protocol, path, trailing dots, trailing slashes, whitespace.
 */
function sanitizeDomain(raw) {
    return raw
        .trim()
        .replace(REGEX.URL_PROTOCOL, "")
        .replace(REGEX.URL_PATH, "")
        .replace(REGEX.TRAILING_DOT, "")
        .replace(/\/+$/, "")
        .toLowerCase()
        .trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function handleAutoTarget(cmd, args, opts) {
    let cleanCmd = sanitizeDomain(cmd);
    let output = "";

    // Detect raw domain → auto target + dig
    if (/^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i.test(cleanCmd)) {
        ContextManager.setManualTarget(cleanCmd);
        const mt = args[0]?.toUpperCase();
        if (mt && DNS_TYPES.includes(mt)) {
            output = await cmdDig([cleanCmd], { forcedType: mt, opts, isShortcut: true });
        } else {
            output = `\n${getSeparator()}\n${ANSI.green}Target set: ${ANSI.yellow}${cleanCmd}${ANSI.reset}\n`;

            // Write "Target set" directly — progressive path bypasses writeOutput()
            const targetLines = output.split("\n");
            for (const line of targetLines) {
                term.writeln(line);
            }

            // ── Progressive Triage ──────────────────────────────────
            if (_activeRenderer) {
                _activeRenderer.cancel();
                _activeRenderer = null;
            }

            const renderer = new ProgressiveRenderer(term);
            _activeRenderer = renderer;
            renderer.renderSkeleton();

            // ── Apex for WHOIS, original for DNS ────────────────────
            const apexDomain = toApex(cleanCmd);
            const isSubdomain = apexDomain !== cleanCmd;

            // ── Interactive Banner Timer ────────────────────────────
            let bannerShown = false;
            const bannerTimer = setTimeout(() => {
                if (renderer.isCancelled()) return;
                bannerShown = true;
                term.writeln(`\n${ANSI.cyan}[INFO]${ANSI.reset} ${ANSI.dim}Background triage active.${ANSI.reset}`);
                renderer.addExternalLines(2);
            }, 1500);

            // ── Per-row resolution (each self-contained) ────────────
            await Promise.allSettled([
                resolveRegistrarRow(renderer, apexDomain, isSubdomain),
                resolveNSRow(renderer, cleanCmd, opts),
                resolveWebHostRow(renderer, cleanCmd, opts),
            ]);
            clearTimeout(bannerTimer);

            if (!renderer.isCancelled()) {
                const confirmedCount = renderer.getConfirmedCount();
                const provs = Object.values(renderer._resolved).filter(Boolean);

                renderer.finalize(confirmedCount >= 2 && provs.length >= 2 ? provs : []);

                if (confirmedCount < 3) {
                    term.writeln(`${ANSI.cyan}[INFO]${ANSI.reset} Check WHOIS: https://www.whois.com/whois/${cleanCmd}`);
                    renderer.addExternalLines(1);
                }

                output += buildTriageHistory(renderer._resolved, provs);
            }

            if (_activeRenderer === renderer) _activeRenderer = null;
            return { output, backgroundTriage: bannerShown };
        }
        return output;
    }

    // Detect raw IP → auto target + rev-dns
    if (isIPAddress(cleanCmd)) {
        ContextManager.setManualTarget(cleanCmd);
        output = `\n${getSeparator()}\n${ANSI.green}Target set: ${ANSI.yellow}${cleanCmd}${ANSI.reset} ${ANSI.dim}[IP detected]${ANSI.reset}\n`;
        output += `${ANSI.dim}Running rev-dns...\x1b[0m\n\n`;
        try {
            output += await cmdRevDNS([cleanCmd]);
        } catch (e) {
            output += cmdError(`rev-dns failed: ${e.message}`);
        }
        return output;
    }

    // Unrecognized string -> provide suggestions
    const suggestion = suggestCommand(cmd);
    let errMsg = `${ANSI.red}Unknown command: '${cmd}'${ANSI.reset}`;
    if (suggestion) {
        errMsg += `\n${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}`;
    }
    errMsg += `\n${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for available commands.${ANSI.reset}`;
    return errMsg;
}
