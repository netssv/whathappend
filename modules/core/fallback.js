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
import { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";
import { resolveProvider, isRdapMaintainer } from "../utils.js";

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
                    term.writeln(`${ANSI.cyan}[INFO]${ANSI.reset} Check WHOIS: https://www.whois.com/whois/${apexDomain}`);
                    renderer.addExternalLines(1);
                }

                output += buildTriageHistory(renderer._resolved, provs);
            }

            if (_activeRenderer === renderer) _activeRenderer = null;

            // ── Background Header Retry ─────────────────────────────
            // If any triad field is still empty, keep trying in the
            // background with a longer timeout (best-effort, fire-and-forget)
            const resolved = renderer._resolved;
            retryEmptyHeaderFields(cleanCmd, apexDomain, resolved);

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

// ---------------------------------------------------------------------------
// Background Header Retry — Best-effort for empty triad fields
// ---------------------------------------------------------------------------

const RETRY_TIMEOUT = 15000;
let _retryGeneration = 0;

function retryEmptyHeaderFields(domain, apexDomain, resolved) {
    const missing = [];
    if (!resolved.registrar) missing.push("registrar");
    if (!resolved.ns) missing.push("ns");
    if (!resolved.webhost) missing.push("webhost");
    if (missing.length === 0) return;

    // Increment generation — any in-flight retries from a previous target
    // will see a stale generation and discard their results
    const gen = ++_retryGeneration;

    // Fire-and-forget — no terminal output, only header updates
    for (const field of missing) {
        if (field === "registrar") {
            retryRegistrar(apexDomain, gen);
        } else if (field === "ns") {
            retryNS(domain, gen);
        } else if (field === "webhost") {
            retryWebHost(domain, gen);
        }
    }
}

function isStale(gen) { return gen !== _retryGeneration; }

async function retryRegistrar(apexDomain, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } })
        );
        if (isStale(gen)) return;
        if (resp?.success && resp.registrar && resp.registrar !== "Unknown") {
            updateWhoisFields(resp.registrar, `https://www.whois.com/whois/${apexDomain}`);
            setSessionTriad("registrar", resp.registrar);
            return;
        }
    } catch (_) {}
    // Still empty — mark as user-retryable
    if (!isStale(gen)) markFieldRetryable("registrar");
}

async function retryNS(domain, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "NS" } })
        );
        if (isStale(gen)) return;
        const nsRecords = resp?.data?.Answer?.filter(a => a.type === 2);
        if (!nsRecords || nsRecords.length === 0) return;

        const nsHost = nsRecords[0].data.replace(/\.$/, "");
        const targetRoot = domain.split(".").slice(-2).join(".");
        const nsRoot = nsHost.split(".").slice(-2).join(".");
        const nsUrl = `https://intodns.com/${domain}`;

        if (nsRoot === targetRoot) {
            const label = `Self-hosted (${targetRoot})`;
            updateNSField(label, nsUrl);
            setSessionTriad("ns", label);
            return;
        }

        // Resolve NS hostname IP → provider
        try {
            const aResp = await raceRetry(
                chrome.runtime.sendMessage({ command: "dns", payload: { domain: nsHost, type: "A" } })
            );
            if (isStale(gen)) return;
            const nsA = aResp?.data?.Answer?.find(a => a.type === 1);
            if (nsA?.data) {
                const provider = await raceRetry(resolveProvider(nsA.data));
                if (isStale(gen)) return;
                // Filter out RDAP maintainer refs (e.g. "AS8560-MNT", "CLDIN-MNT")
                if (provider && !isRdapMaintainer(provider)) {
                    updateNSField(provider, nsUrl);
                    setSessionTriad("ns", provider);
                    return;
                }
            }
        } catch (_) {}

        if (isStale(gen)) return;
        // Fallback: capitalize domain root
        const fb = nsRoot.split(".")[0];
        const label = fb.charAt(0).toUpperCase() + fb.slice(1);
        updateNSField(label, nsUrl);
        setSessionTriad("ns", label);
    } catch (_) {
        if (!isStale(gen)) markFieldRetryable("ns");
    }
}

async function retryWebHost(domain, gen) {
    try {
        const resp = await raceRetry(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain, type: "A" } })
        );
        if (isStale(gen)) return;
        const aRecord = resp?.data?.Answer?.find(a => a.type === 1);
        if (!aRecord?.data) return;

        const ip = aRecord.data;
        const provider = await raceRetry(resolveProvider(ip));
        if (isStale(gen)) return;
        // Filter out RDAP maintainer refs
        if (provider && !isRdapMaintainer(provider)) {
            updateHostField(provider, `https://ipinfo.io/${ip}`);
            setSessionTriad("host", provider);
            return;
        }
    } catch (_) {}
    // Still empty — mark as user-retryable
    if (!isStale(gen)) markFieldRetryable("host");
}

function raceRetry(promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("RETRY_TIMEOUT")), RETRY_TIMEOUT)),
    ]);
}
