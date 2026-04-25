import { ANSI, isIPAddress, toApex, cmdError, getSeparator } from "../formatter.js";
import { REGEX } from "../data/constants.js";
import { resolveProvider } from "../utils.js";
import { DNS_TYPES } from "../data/aliases.js";
import { ContextManager } from "../context.js";
import { cmdDig } from "../commands/dns/index.js";
import { cmdRevDNS } from "../commands/native/index.js";
import { suggestCommand } from "./parser.js";
import { term } from "../terminal/terminal-ui.js";
import { ProgressiveRenderer } from "../terminal/progressive-renderer.js";
import { buildTriageHistory } from "../terminal/triage-history.js";

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let _activeRenderer = null;

const ROW_TIMEOUT = 3500;  // Per-row timeout (ms)
const NA_LABEL = `${ANSI.dim}[N/A]${ANSI.reset}`;

// ---------------------------------------------------------------------------
// Aggressive Apex Normalization
// ---------------------------------------------------------------------------

/**
 * Sanitize raw user input into a clean domain for DNS queries.
 * Strips protocol, path, trailing dots, trailing slashes, whitespace.
 *
 *   "  samanthadean.com  " → "samanthadean.com"
 *   "www.facebook.com/"   → "www.facebook.com"
 *   "http://example.com/path" → "example.com"
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
            const pRow1 = resolveRegistrarRow(renderer, apexDomain, isSubdomain);
            const pRow2 = resolveNSRow(renderer, cleanCmd, opts);
            const pRow3 = resolveWebHostRow(renderer, cleanCmd, opts);

            // Wait for ALL rows to settle (each has own 3.5s timeout)
            await Promise.allSettled([pRow1, pRow2, pRow3]);
            clearTimeout(bannerTimer);

            if (!renderer.isCancelled()) {
                // ── Gatekeeper: only finalize with ≥2 confirmed ─────
                const confirmedCount = renderer.getConfirmedCount();
                const provs = Object.values(renderer._resolved).filter(Boolean);

                if (confirmedCount >= 2 && provs.length >= 2) {
                    renderer.finalize(provs);
                } else {
                    renderer.finalize([]);
                }

                if (confirmedCount < 3) {
                    term.writeln(`${ANSI.cyan}[INFO]${ANSI.reset} Check WHOIS: https://www.whois.com/whois/${cleanCmd}`);
                    renderer.addExternalLines(1);
                }

                output += buildTriageHistory(renderer._resolved, provs);
            }

            if (_activeRenderer === renderer) {
                _activeRenderer = null;
            }

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

// =========================================================================
// Self-contained row resolvers (each with own try/catch + 3.5s timeout)
// =========================================================================

/**
 * Row 1: Registrar — uses APEX domain for WHOIS/RDAP
 */
async function resolveRegistrarRow(renderer, apexDomain, isSubdomain) {
    if (renderer.isCancelled()) return;
    try {
        const resp = await raceTimeout(
            chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } }),
            ROW_TIMEOUT
        );
        if (renderer.isCancelled()) return;

        if (resp?.success) {
            const registrar = (resp.registrar && resp.registrar !== "Unknown") ? resp.registrar : null;
            const label = registrar
                ? (isSubdomain ? `${registrar} ${ANSI.dim}(${apexDomain})${ANSI.reset}` : registrar)
                : null;
            renderer.updateRow("registrar", label);
        } else {
            renderer.updateRow("registrar", null);
        }
    } catch (_) {
        renderer.updateRow("registrar", NA_LABEL);
    }
}

/**
 * Row 2: NameServers — uses ORIGINAL domain for DNS
 * Resilient NS parser: accepts lines ending with "." OR bare hostnames.
 */
async function resolveNSRow(renderer, originalDomain, opts) {
    if (renderer.isCancelled()) return;
    try {
        const nsOut = await raceTimeout(
            cmdDig([originalDomain], { forcedType: "NS", opts, isShortcut: true }).catch(() => ""),
            ROW_TIMEOUT
        );
        if (renderer.isCancelled()) return;

        // Resilient parser: accept NS lines with or without trailing dot
        const nsDomains = nsOut.split('\n')
            .map(l => l.trim())
            .filter(l => l && /^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}\.?$/i.test(l))
            .map(l => l.replace(/\.$/, ""));

        if (nsDomains.length === 0) {
            renderer.updateRow("ns", null);
            return;
        }

        const targetRoot = originalDomain.split(".").slice(-2).join(".");
        const nsRoot = nsDomains[0].split(".").slice(-2).join(".");

        if (nsRoot === targetRoot) {
            renderer.updateRow("ns", `Self-hosted (${targetRoot})`);
            return;
        }

        // Resolve NS provider via RDAP
        try {
            const resp = await raceTimeout(
                chrome.runtime.sendMessage({ command: "whois", payload: { domain: nsRoot } }),
                ROW_TIMEOUT
            );
            if (renderer.isCancelled()) return;
            if (resp?.success && resp.data?.entities?.length) {
                for (const e of resp.data.entities) {
                    if (e.vcardArray?.[1]) {
                        for (const p of e.vcardArray[1]) {
                            if ((p[0] === "org" || p[0] === "fn") && p[3]) {
                                renderer.updateRow("ns", p[3]);
                                return;
                            }
                        }
                    }
                }
            }
        } catch (_) {}

        renderer.updateRow("ns", null);
    } catch (_) {
        renderer.updateRow("ns", NA_LABEL);
    }
}

/**
 * Row 3: Web Host — uses ORIGINAL domain for A record, then RDAP on IP
 */
async function resolveWebHostRow(renderer, originalDomain, opts) {
    if (renderer.isCancelled()) return;
    try {
        const aOut = await raceTimeout(
            cmdDig([originalDomain], {
                forcedType: "A",
                opts: [...(opts || []), "+noinsights"],
                isShortcut: true,
            }).catch(() => ""),
            ROW_TIMEOUT
        );
        if (renderer.isCancelled()) return;

        const ips = aOut.split('\n')
            .map(l => l.trim())
            .filter(l => /^\d{1,3}(\.\d{1,3}){3}$/.test(l));

        if (ips.length === 0) {
            renderer.updateRow("webhost", null);
            return;
        }

        try {
            const provider = await raceTimeout(resolveProvider(ips[0]), ROW_TIMEOUT);
            if (renderer.isCancelled()) return;
            renderer.updateRow("webhost", provider);
        } catch (_) {
            renderer.updateRow("webhost", NA_LABEL);
        }
    } catch (_) {
        renderer.updateRow("webhost", NA_LABEL);
    }
}

// ---------------------------------------------------------------------------
// Timeout utility — rejects on timeout (catch triggers [N/A])
// ---------------------------------------------------------------------------

function raceTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
}
