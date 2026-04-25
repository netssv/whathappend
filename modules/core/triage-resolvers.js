import { ANSI } from "../formatter.js";
import { resolveProvider } from "../utils.js";
import { cmdDig } from "../commands/dns/index.js";

// ===================================================================
// Triage Row Resolvers — Self-contained async resolvers for each
// row of the progressive triage skeleton.
// ===================================================================

const ROW_TIMEOUT = 3500;
const NA_LABEL = `${ANSI.dim}[N/A]${ANSI.reset}`;

// ---------------------------------------------------------------------------
// Row 1: Registrar — uses APEX domain for WHOIS/RDAP
// ---------------------------------------------------------------------------

export async function resolveRegistrarRow(renderer, apexDomain, isSubdomain) {
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

// ---------------------------------------------------------------------------
// Row 2: NameServers — uses ORIGINAL domain for DNS
// ---------------------------------------------------------------------------

export async function resolveNSRow(renderer, originalDomain, opts) {
    if (renderer.isCancelled()) return;
    try {
        const nsOut = await raceTimeout(
            cmdDig([originalDomain], { forcedType: "NS", opts, isShortcut: true }).catch(() => ""),
            ROW_TIMEOUT
        );
        if (renderer.isCancelled()) return;

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

        // Resolve NS operator via IP-based lookup (more reliable than RDAP)
        try {
            const nsIpOut = await raceTimeout(
                cmdDig([nsDomains[0]], { forcedType: "A", opts: ["+noinsights"], isShortcut: true }).catch(() => ""),
                ROW_TIMEOUT
            );
            if (renderer.isCancelled()) return;
            const nsIp = nsIpOut.split('\n').map(l => l.trim()).find(l => /^\d{1,3}(\.\d{1,3}){3}$/.test(l));
            if (nsIp) {
                const provider = await raceTimeout(resolveProvider(nsIp), ROW_TIMEOUT);
                if (renderer.isCancelled()) return;
                if (provider) {
                    renderer.updateRow("ns", provider);
                    return;
                }
            }
        } catch (_) {}

        // Fallback: infer from domain name (google.com → Google)
        const fallback = nsRoot.split(".")[0];
        renderer.updateRow("ns", fallback.charAt(0).toUpperCase() + fallback.slice(1));
    } catch (_) {
        renderer.updateRow("ns", NA_LABEL);
    }
}

// ---------------------------------------------------------------------------
// Row 3: Web Host — uses ORIGINAL domain for A record, then RDAP on IP
// ---------------------------------------------------------------------------

export async function resolveWebHostRow(renderer, originalDomain, opts) {
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
// Timeout utility
// ---------------------------------------------------------------------------

function raceTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
}
