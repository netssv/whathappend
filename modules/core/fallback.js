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

            // Phase 1: WHOIS domain (registrar + expiry)
            let wOut = "";
            try {
                wOut = await cmdWhois([cleanCmd], ["--short"]);
                if (wOut && wOut.trim() && !wOut.includes("[ERROR]")) output += wOut + "\n";
            } catch (_) {}

            // Phase 2: NS, A, Trace in parallel (DNS only, no RDAP)
            const [nsOut, aOut, traceOut] = await Promise.all([
                cmdDig([cleanCmd], { forcedType: "NS", opts, isShortcut: true }),
                cmdDig([cleanCmd], { forcedType: "A", opts: [...(opts || []), "+noinsights"], isShortcut: true }),
                cmdTrace([cleanCmd])
            ]);

            const splitToken = `\x1b[2m── INSIGHTS ──\x1b[0m`;
            let insightsArr = [];
            
            const extractInsights = (str) => {
                if (str && str.includes(splitToken)) {
                    const parts = str.split(splitToken);
                    if (parts[1].trim()) insightsArr.push(parts[1].trim());
                    return parts[0].trimEnd() + "\n";
                }
                return str;
            };

            const traceStr = extractInsights(traceOut);
            const nsStr = extractInsights(nsOut);
            const aStr = extractInsights(aOut);
            
            output += "\n" + traceStr + "\n" + nsStr + "\n" + aStr;

            // --- Domain Delegation ---
            const ips = aOut.split('\n').filter(l => /^\d{1,3}(\.\d{1,3}){3}$/.test(l.trim())).map(l => l.trim());
            const nsDomains = nsOut.split('\n').filter(l => l.trim().endsWith('.')).map(l => l.replace(/\.$/, "").trim());
            const targetRoot = cleanCmd.split(".").slice(-2).join(".");

            // Extract registrar from WHOIS --short output
            let registrarProvider = null;
            if (wOut) {
                const lines = wOut.split('\n');
                for (const l of lines) {
                    if (l.includes('Registrar:') || l.includes('Owner:')) {
                        const noAnsi = l.replace(REGEX.ANSI_STRIP, "");
                        const key = noAnsi.includes('Registrar:') ? 'Registrar:' : 'Owner:';
                        const regName = noAnsi.split(key)[1]?.trim() || "";
                        if (regName && regName !== "Unknown" && regName !== "Not available") {
                            registrarProvider = regName;
                        }
                        break;
                    }
                }
            }

            // Phase 3: RDAP lookups (sequential — no competition)
            // NS provider: self-hosted → RDAP on NS root domain
            let dnsProvider = null;
            if (nsDomains.length > 0) {
                const nsRoot = nsDomains[0].split(".").slice(-2).join(".");
                if (nsRoot === targetRoot) {
                    dnsProvider = `Self-hosted (${targetRoot})`;
                } else {
                    try {
                        const resp = await chrome.runtime.sendMessage({
                            command: "whois", payload: { domain: nsRoot }
                        });
                        if (resp?.success && resp.data?.entities?.length) {
                            for (const e of resp.data.entities) {
                                if (e.vcardArray?.[1]) {
                                    for (const p of e.vcardArray[1]) {
                                        if ((p[0] === "org" || p[0] === "fn") && p[3]) {
                                            dnsProvider = p[3];
                                            break;
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
            if (ips.length > 0) {
                webProvider = await resolveProvider(ips[0]);
            }

            const stackParts = [];
            if (registrarProvider) stackParts.push(`Reg: ${registrarProvider}`);
            if (dnsProvider) stackParts.push(`DNS: ${dnsProvider}`);
            if (webProvider) stackParts.push(`Web: ${webProvider}`);

            if (stackParts.length >= 1) {
                const provs = [registrarProvider, dnsProvider, webProvider].filter(Boolean);
                const allSame = provs.length >= 2 && provs.every(p => p === provs[0]);
                const manual = `${ANSI.dim}Manual check${ANSI.reset}`;

                let delO = `\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`;
                delO += `\n       ${ANSI.white}Registrar${ANSI.reset} ━ ${registrarProvider || manual}`;
                delO += `\n       ${ANSI.white}NameSrvs${ANSI.reset}  ━ ${dnsProvider || manual}`;
                delO += `\n       ${ANSI.white}Web Host${ANSI.reset}  ━ ${webProvider || manual}`;
                
                if (allSame) {
                    delO += `\n       ${ANSI.green}↳ Consolidated Stack (${provs[0]})${ANSI.reset}`;
                } else if (provs.length >= 2) {
                    delO += `\n       ${ANSI.yellow}↳ Distributed Stack${ANSI.reset}`;
                }
                insightsArr.unshift(delO);

                // Add manual WHOIS link when any field is unknown
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
