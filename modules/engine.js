/**
 * WhatHappened — Command Engine (Router)
 *
 * Every command follows a strict 3-part output:
 *   1. RAW — authentic data (short for shortcuts, verbose for dig)
 *   2. EXPLAIN — dim gray note on what was executed
 *   3. INSIGHTS — colored actionable findings
 */

import {ANSI, generateImpactSection, isIPAddress, resolveTargetDomain, cmdUsage, cmdError, workerError } from "./formatter.js";
import { CMD_ALIASES, DNS_SHORTCUTS } from "./data/aliases.js";

// Core logic modules
import { parseCommand, suggestCommand } from "./core/parser.js";
import { checkTargetGuards } from "./core/guards.js";
import { handleAutoTarget } from "./core/fallback.js";

// Command modules
import { cmdDig, cmdHost, cmdNslookup, cmdTTL, cmdDnssec } from "./commands/dns/index.js";
import { cmdEmail, cmdSPF, cmdDMARC, cmdDKIM } from "./commands/email/index.js";
import { cmdCurl, cmdOpenSSL, cmdWhois, cmdPing, cmdTrace, cmdRobots, cmdSec, cmdWeb, cmdPixels, cmdLoad, cmdRegistrar, cmdHosting, cmdHistory, cmdLinks, cmdWayback, cmdGreen, cmdCookies, cmdIsUp, cmdSpeed, cmdSpeedtest, cmdIP } from "./commands/web/index.js";
import { cmdSecurityTxt } from "./commands/web/security-txt.js";
import { cmdVitals } from "./commands/web/vitals.js";
import { cmdFlush } from "./commands/web/flush.js";
import { cmdRevDNS, cmdPortScan, cmdFTPCheck, cmdExport, cmdBlacklist, cmdSSLLabs, cmdSecurityHeaders, cmdWhoisExt } from "./commands/native/index.js";
import { cmdTarget, cmdHelp, cmdDetailedHelp, cmdErrors, cmdAbout, cmdInfo, cmdExit, cmdSwitch, cmdStart, cmdConfig, cmdNotes } from "./commands/util/index.js";
import { cmdStack } from "./commands/stack/index.js";

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
            switch (resolved) {
                case "dig": output = await cmdDig(args, { opts }); break;
                case "host": output = await cmdHost(args); break;
                case "nslookup": output = await cmdNslookup(args); break;
                case "curl": output = await cmdCurl(args); break;
                case "openssl": output = await cmdOpenSSL(args); break;
                case "whois": output = await cmdWhois(args, flags); break;
                case "ping": output = await cmdPing(args); break;
                case "trace": output = await cmdTrace(args); break;
                case "email": output = await cmdEmail(args); break;
                case "web": output = await cmdWeb(args); break;
                case "ttl": output = await cmdTTL(args); break;
                case "dnssec": output = await cmdDnssec(args); break;
                case "spf": output = await cmdSPF(args); break;
                case "dmarc": output = await cmdDMARC(args); break;
                case "dkim": output = await cmdDKIM(args); break;
                case "robots": output = await cmdRobots(args); break;
                case "sec": output = await cmdSec(args); break;
                case "pixels": output = await cmdPixels(args); break;
                case "links": output = await cmdLinks(args); break;
                case "load": output = await cmdLoad(args); break;
                case "registrar": output = await cmdRegistrar(args); break;
                case "hosting": output = await cmdHosting(args); break;
                case "history": output = await cmdHistory(args); break;
                case "wayback": output = await cmdWayback(args); break;
                case "green": output = await cmdGreen(args); break;
                case "cookies": output = await cmdCookies(args); break;
                case "isup": output = await cmdIsUp(args); break;
                case "speed": output = await cmdSpeed(args); break;
                case "speedtest": output = await cmdSpeedtest(args); break;
                case "stack": output = await cmdStack(args); break;
                case "ip": output = await cmdIP(args); break;
                case "security-txt": output = await cmdSecurityTxt(args); break;
                case "vitals": output = await cmdVitals(args); break;
                case "flush": output = await cmdFlush(args); break;
                case "notes": output = await cmdNotes(args); break;
                case "rev-dns": output = await cmdRevDNS(args); break;
                case "port-scan": output = await cmdPortScan(args); break;
                case "ftp-check": output = await cmdFTPCheck(args); break;
                case "blacklist": output = cmdBlacklist(args); break;
                case "ssllabs": output = cmdSSLLabs(args); break;
                case "securityheaders": output = cmdSecurityHeaders(args); break;
                case "whois-ext": output = cmdWhoisExt(args); break;
                case "export": output = await cmdExport(args); break;
                case "target": output = cmdTarget(args); break;
                case "help": output = cmdHelp(); break;
                case "errors": output = cmdErrors(); break;
                case "about": output = await cmdAbout(); break;
                case "info": output = await cmdInfo(); break;
                case "exit": output = await cmdExit(); break;
                case "switch": {
                    const result = await cmdSwitch();
                    if (result && typeof result === "object" && result.__switch) {
                        // Re-enter engine with the domain — triggers handleAutoTarget
                        return await executeCommand(result.domain);
                    }
                    output = result;
                    break;
                }
                case "start": {
                    const result = await cmdStart(args);
                    if (result && typeof result === "object" && result.__switch) {
                        return await executeCommand(result.domain);
                    }
                    output = result;
                    break;
                }
                case "config": output = await cmdConfig(args); break;
                case "clear": return "__CLEAR__";
                default:
                    // If not a known command, check if it's an auto-target domain/IP
                    output = await handleAutoTarget(cmd, args, opts);
                    // Progressive triage returns an object — pass through directly
                    if (output && typeof output === "object" && output.backgroundTriage !== undefined) {
                        return output;
                    }
                    break;
            }
        }
    } catch (err) {
        output = cmdError(` ${err.message || "Unknown error occurred"}`);
        output += `\n${ANSI.dim}If this persists, try a different domain or check your connection.${ANSI.reset}`;
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
