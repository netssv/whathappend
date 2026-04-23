import { ANSI, isIPAddress, cmdError, getSeparator } from "../formatter.js";
import { REGEX } from "../data/constants.js";
import { resolveProvider } from "../utils.js";
import { DNS_TYPES } from "../data/aliases.js";
import { ContextManager } from "../context.js";
import { cmdDig } from "../commands/dns/index.js";
import { cmdWhois, cmdTrace } from "../commands/web/index.js";
import { cmdRevDNS } from "../commands/native/index.js";
import { suggestCommand } from "./parser.js";

export async function handleAutoTarget(cmd, args, opts) {
    let cleanCmd = cmd.replace(REGEX.URL_PROTOCOL, "").replace(REGEX.URL_PATH, "");
    let output = "";

    // Detect raw domain → auto target + dig
    if (/^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i.test(cleanCmd)) {
        ContextManager.setManualTarget(cleanCmd);
        const mt = args[0]?.toUpperCase();
        if (mt && DNS_TYPES.includes(mt)) {
            output = await cmdDig([cleanCmd], { forcedType: mt, opts, isShortcut: true });
        } else {
            output = `\n${getSeparator()}\n${ANSI.green}Target set: ${ANSI.yellow}${cleanCmd}${ANSI.reset}\n`;

            // ── True Async Triage ──────────────────────────────────────
            // All data is gathered FIRST, then the delegation block is
            // printed ONCE with real values. Nothing prints until all
            // promises have settled.
            // ──────────────────────────────────────────────────────────

            let whoisData = null;
            const pWhois = chrome.runtime.sendMessage({ command: "whois", payload: { domain: cleanCmd } }).catch(() => null);
            const pNs = cmdDig([cleanCmd], { forcedType: "NS", opts, isShortcut: true }).catch(() => "");
            const pA = cmdDig([cleanCmd], { forcedType: "A", opts: [...(opts || []), "+noinsights"], isShortcut: true }).catch(() => "");

            // Latency sentinel — fires if initial data takes > 2.5s
            let latencyWarned = false;
            const latencyTimer = setTimeout(() => { latencyWarned = true; }, 2500);

            const settled = await Promise.allSettled([pWhois, pNs, pA]);
            clearTimeout(latencyTimer);

            const respWhois = settled[0].status === "fulfilled" ? settled[0].value : null;
            const nsOut = settled[1].status === "fulfilled" ? settled[1].value : "";
            const aOut = settled[2].status === "fulfilled" ? settled[2].value : "";

            if (respWhois?.success) whoisData = respWhois.data;

            if (latencyWarned) {
                output += `\n${ANSI.cyan}[INFO]${ANSI.reset} ${ANSI.dim}Heavy network latency detected. Waiting for DNS...${ANSI.reset}\n`;
            }

            const splitToken = `\x1b[2m── INSIGHTS ──\x1b[0m`;
            let insightsArr = [];

            // --- Domain Delegation ---
            const ips = aOut.split('\n').filter(l => /^\d{1,3}(\.\d{1,3}){3}$/.test(l.trim())).map(l => l.trim());
            let nsDomains = nsOut.split('\n').filter(l => l.trim().endsWith('.')).map(l => l.replace(/\.$/, "").trim());
            const targetRoot = cleanCmd.split(".").slice(-2).join(".");

            // Fallback: If dig NS failed, try to extract from WHOIS
            if (nsDomains.length === 0 && whoisData?.nameservers?.length) {
                nsDomains = whoisData.nameservers.map(ns => (ns.ldhName || ns).toLowerCase());
            }

            // Extract registrar from parsed WHOIS
            let registrarProvider = (respWhois?.registrar && respWhois.registrar !== "Unknown") ? respWhois.registrar : null;

            // Phase 3: RDAP lookups (sequential — no competition)
            // NS provider: self-hosted → RDAP on NS root domain
            let dnsProvider = null;
            if (nsDomains.length > 0) {
                const nsRoot = nsDomains[0].split(".").slice(-2).join(".");
                if (nsRoot === targetRoot) {
                    dnsProvider = `Self-hosted (${targetRoot})`;
                } else {
                    try {
                        const resp = await chrome.runtime.sendMessage({ command: "whois", payload: { domain: nsRoot } });
                        if (resp?.success && resp.data?.entities?.length) {
                            for (const e of resp.data.entities) {
                                if (e.vcardArray?.[1]) {
                                    for (const p of e.vcardArray[1]) {
                                        if ((p[0] === "org" || p[0] === "fn") && p[3]) {
                                            dnsProvider = p[3]; break;
                                        }
                                    }
                                }
                                if (dnsProvider) break;
                            }
                        }
                    } catch (_) {}
                }
            }

            // Web host: RDAP on first IP
            let webProvider = null;
            if (ips.length > 0) webProvider = await resolveProvider(ips[0]);

            // ── Build the delegation block ONLY after all data is resolved ──
            const provs = [registrarProvider, dnsProvider, webProvider].filter(Boolean);

            if (provs.length >= 1) {
                const allSame = provs.length >= 2 && provs.every(p => p === provs[0]);
                const na = `${ANSI.dim}N/A${ANSI.reset}`;

                let delO = `\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`;
                delO += `\n       ${ANSI.white}Registrar${ANSI.reset} ━ ${registrarProvider || na}`;
                delO += `\n       ${ANSI.white}NameSrvs${ANSI.reset}  ━ ${dnsProvider || na}`;
                delO += `\n       ${ANSI.white}Web Host${ANSI.reset}  ━ ${webProvider || na}`;
                
                if (allSame) {
                    delO += `\n       ${ANSI.green}↳ Consolidated Stack (${provs[0]})${ANSI.reset}`;
                } else if (provs.length >= 2) {
                    delO += `\n       ${ANSI.yellow}↳ Distributed Stack${ANSI.reset}`;
                }
                insightsArr.unshift(delO);

                // Add manual WHOIS link when any field is unresolvable
                const hasUnknown = !registrarProvider || !dnsProvider || !webProvider;
                if (hasUnknown) {
                    insightsArr.push(`${ANSI.cyan}[INFO]${ANSI.reset} Check WHOIS: https://www.whois.com/whois/${cleanCmd}`);
                }
            }
            // --------------------------------------
            
            if (insightsArr.length > 0) {
                output += "\n" + splitToken + "\n" + insightsArr.join("\n");
            }
        }
        return output;
    }

    // Detect raw IP → auto target + rev-dns
    if (isIPAddress(cleanCmd)) {
        ContextManager.setManualTarget(cleanCmd);
        output = `\n${getSeparator()}\n${ANSI.green}Target set: ${ANSI.yellow}${cleanCmd}${ANSI.reset} ${ANSI.dim}[IP detected]${ANSI.reset}\n`;
        output += `${ANSI.dim}Running rev-dns...${ANSI.reset}\n\n`;
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
