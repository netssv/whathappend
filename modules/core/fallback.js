import { ANSI, isIPAddress, cmdError, getSeparator } from "../formatter.js";
import { REGEX, identifyHostingProvider } from "../data/constants.js";
import { isCloudflareIP, resolveProvider } from "../utils.js";
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
            let wOut = "";
            try {
                wOut = await cmdWhois([cleanCmd], ["--short"]);
                if (!wOut.includes("[ERROR]")) output += wOut + "\n";
            } catch (_) {}
            
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

            // --- DNS vs Web Hosting Correlation ---
            const ips = aOut.split('\n').filter(l => /^\d{1,3}(\.\d{1,3}){3}$/.test(l.trim())).map(l => l.trim());
            const nsDomains = nsOut.split('\n').filter(l => l.trim().endsWith('.')).map(l => l.replace(/\.$/, "").trim());

            let registrarProvider = null;
            let dnsProvider = null;
            let webProvider = null;

            if (wOut) {
                const lines = wOut.split('\n');
                for (const l of lines) {
                    if (l.includes('Registrar:')) {
                        const noAnsi = l.replace(REGEX.ANSI_STRIP, "");
                        const regName = noAnsi.split('Registrar:')[1]?.trim() || "";
                        if (regName && regName !== "Unknown" && regName !== "Not available") {
                            registrarProvider = identifyHostingProvider(regName) || regName; // use raw name if not mapped
                        }
                        break;
                    }
                }
            }

            for (const ns of nsDomains) {
                const mapped = identifyHostingProvider(ns);
                if (mapped) {
                    dnsProvider = mapped;
                    break;
                }
            }

            if (ips.length > 0) {
                webProvider = await resolveProvider(ips[0]);
            }

            const stackParts = [];
            if (registrarProvider) stackParts.push(`Reg: ${registrarProvider}`);
            if (dnsProvider) stackParts.push(`DNS: ${dnsProvider}`);
            if (webProvider) stackParts.push(`Web: ${webProvider}`);

            if (stackParts.length >= 2) {
                // Check if all non-null providers are identical
                const provs = [registrarProvider, dnsProvider, webProvider].filter(Boolean);
                const allSame = provs.every(p => p === provs[0]);

                let delO = `\n${ANSI.cyan}${ANSI.bold}[INFO] Domain Delegation:${ANSI.reset}`;
                delO += `\n       ${ANSI.white}Registrar${ANSI.reset} ━ ${registrarProvider || "Unknown"}`;
                delO += `\n       ${ANSI.white}NameSrvs${ANSI.reset}  ━ ${dnsProvider || "Unknown"}`;
                delO += `\n       ${ANSI.white}Web Host${ANSI.reset}  ━ ${webProvider || "Unknown"}`;
                
                if (allSame) {
                    delO += `\n       ${ANSI.green}↳ Consolidated Stack (${provs[0]})${ANSI.reset}`;
                } else {
                    delO += `\n       ${ANSI.yellow}↳ Distributed Stack${ANSI.reset}`;
                }
                insightsArr.unshift(delO);
            } else if (webProvider) {
                insightsArr.unshift(`[INFO] Web hosted by ${webProvider}.`);
            } else if (dnsProvider) {
                insightsArr.unshift(`[INFO] DNS hosted by ${dnsProvider}.`);
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
