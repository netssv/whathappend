import { ANSI } from "../formatter.js";
import { resolveProvider, isRdapMaintainer } from "../utils.js";
import { cmdDig } from "../commands/dns/index.js";
import { updateWhoisFields, updateNSField, updateHostField } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";

// ===================================================================
// Triage Row Resolvers — Self-contained async resolvers for each
// row of the progressive triage skeleton.
// ===================================================================

const ROW_TIMEOUT = 5000;

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

            // Push to header triad + persist
            if (registrar) {
                updateWhoisFields(registrar, `https://www.whois.com/whois/${apexDomain}`);
                setSessionTriad("registrar", registrar);
            }
        } else {
            renderer.updateRow("registrar", null);
        }
    } catch (_) {
        renderer.updateRow("registrar", null);
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
        const nsUrl = `https://intodns.com/${originalDomain}`;

        if (nsRoot === targetRoot) {
            const selfLabel = `Self-hosted (${targetRoot})`;
            renderer.updateRow("ns", selfLabel);
            updateNSField(selfLabel, nsUrl);
            setSessionTriad("ns", selfLabel);
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
                    // Filter out RDAP maintainer refs (e.g. "AS8560-MNT")
                    if (isRdapMaintainer(provider)) {
                        // Fall through to domain-name fallback below
                    } else {
                        renderer.updateRow("ns", provider);
                        updateNSField(provider, nsUrl);
                        setSessionTriad("ns", provider);
                        return;
                    }
                }
            }
        } catch (_) {}

        // Fallback: infer from domain name (google.com → Google)
        const fallback = nsRoot.split(".")[0];
        const fallbackLabel = fallback.charAt(0).toUpperCase() + fallback.slice(1);
        renderer.updateRow("ns", fallbackLabel);
        updateNSField(fallbackLabel, nsUrl);
        setSessionTriad("ns", fallbackLabel);
    } catch (_) {
        renderer.updateRow("ns", null);
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
            // Filter out RDAP maintainer refs
            const cleanProvider = (provider && !isRdapMaintainer(provider)) ? provider : null;
            renderer.updateRow("webhost", cleanProvider);

            // Push to header triad + persist
            if (cleanProvider) {
                updateHostField(cleanProvider, `https://ipinfo.io/${ips[0]}`);
                setSessionTriad("host", cleanProvider);
            }
        } catch (_) {
            renderer.updateRow("webhost", null);
        }
    } catch (_) {
        renderer.updateRow("webhost", null);
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
