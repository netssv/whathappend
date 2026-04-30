/**
 * @module modules/commands/dns/dig.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, toRegisteredDomain, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - DNS_TYPES, DNS_NUM from '../../data/aliases.js'
 *     - digInsights from './dig-insights.js'
 *     - getConfig from '../util/config.js'
 * - Exports: cmdDig, digInsights
 * - Layer: Command Layer (DNS) - Executes DNS resolution and formatting.
 */

import {ANSI, insights, resolveTargetDomain, toRegisteredDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { DNS_TYPES, DNS_NUM } from "../../data/aliases.js";
import { digInsights } from "./dig-insights.js";
import { getConfig } from "../util/config.js";

// ===================================================================
//  dig — Full DNS lookup via Google DoH
// ===================================================================

// Record types that should auto-strip to root domain in shortcut mode
const ROOT_DOMAIN_TYPES = new Set(["MX", "TXT", "NS", "SOA"]);

export async function cmdDig(args, options = {}) {
    const { forcedType = null, opts = [], isShortcut = false } = options;
    const info = {};
    let domain, recordType;
    const isRawShort = opts?.includes("+short");

    if (forcedType) {
        domain = resolveTargetDomain(args[0], info); recordType = forcedType;
    } else if (args.length === 0) {
        domain = resolveTargetDomain(undefined, info); recordType = "A";
    } else if (args.length === 1) {
        if (DNS_TYPES.includes(args[0].toUpperCase())) {
            recordType = args[0].toUpperCase(); domain = resolveTargetDomain(undefined, info);
        } else { domain = resolveTargetDomain(args[0], info); recordType = "A"; }
    } else {
        domain = resolveTargetDomain(args[0], info);
        recordType = (args[1]||"A").toUpperCase();
    }

    // MX/TXT/NS/SOA records live on root domains — auto-strip subdomains in shortcut mode
    if (isShortcut && domain && ROOT_DOMAIN_TYPES.has(recordType)) {
        domain = toRegisteredDomain(domain);
    }

    if (!domain) return cmdUsage("dig", "<domain> [type] [+short]");
    if (!DNS_TYPES.includes(recordType)) return cmdError(`Invalid type: ${recordType}`);

    const resp = await chrome.runtime.sendMessage({command:"dns",payload:{domain,type:recordType}});
    if (!resp) return workerError();
    if (resp.error && !resp.data) return cmdError(resp.error);

    // SERVFAIL after retry — show partial data + critical insight
    const isServfail = resp.retried && resp.error;
    const data = resp.data;
    let o = "";

    const isExpert = await getConfig("expert-mode");
    if (isExpert && !isRawShort) {
        return `> dig ${domain} ${recordType.toLowerCase()}\n${ANSI.dim}${JSON.stringify(data, null, 2)}${ANSI.reset}\n`;
    }

    // +short flag: raw data only, no insights (copy-paste mode)
    if (isRawShort) {
        o += `> dig ${domain} ${recordType.toLowerCase()} +short\n`;
        if (data.Answer?.length) {
            for (const r of data.Answer) o += `${r.data||""}\n`;
        } else {
            o += `${ANSI.dim}(no records)${ANSI.reset}\n`;
        }
        return o.trimEnd();
    }

    // Shortcut mode: $ command + raw data + insights
    if (isShortcut) {
        o += `> dig ${domain} ${recordType.toLowerCase()} +short\n`;
        if (data.Answer?.length) {
            for (const r of data.Answer) o += `${r.data||""}\n`;
        } else {
            o += `${ANSI.dim}(no records)${ANSI.reset}\n`;
        }
        if (!opts?.includes("+noinsights")) {
            o += insights(await digInsights(domain, recordType, data));
        }
        return o;
    }

    // Full dig verbose output + explanation + insights
    const st = data.Status;
    const stN = {0:"NOERROR",1:"FORMERR",2:"SERVFAIL",3:"NXDOMAIN",5:"REFUSED"}[st]||`STATUS_${st}`;
    const stC = st===0?ANSI.green:ANSI.red;
    const ac = data.Answer?.length||0;
    const auc = data.Authority?.length||0;

    o += `> dig ${domain} ${recordType.toLowerCase()}\n`;
    o += `\n${ANSI.cyan}; <<>> DiG 9.18 <<>> ${domain} ${recordType}${ANSI.reset}\n`;
    o += `${ANSI.dim};; ->>HEADER<<- opcode: QUERY, status: ${stC}${stN}${ANSI.reset}\n`;
    o += `${ANSI.dim};; flags: qr rd ra; QUERY: 1, ANSWER: ${ac}, AUTHORITY: ${auc}${ANSI.reset}\n\n`;
    o += `${ANSI.dim};; QUESTION SECTION:${ANSI.reset}\n`;
    o += `${ANSI.green};${domain}.\t\tIN\t${recordType}${ANSI.reset}\n\n`;

    if (ac > 0) {
        o += `${ANSI.dim};; ANSWER SECTION:${ANSI.reset}\n`;
        for (const r of data.Answer) {
            o += `${domain}.\t${r.TTL||0}\tIN\t${DNS_NUM[r.type]||"??"}\t${r.data||""}\n`;
        }
    }

    if (auc > 0) {
        o += `\n${ANSI.dim};; AUTHORITY SECTION:${ANSI.reset}\n`;
        for (const r of data.Authority) o += `${r.name||domain}.\t${r.TTL||0}\tIN\t${DNS_NUM[r.type]||"??"}\t${r.data||""}\n`;
    }

    o += `\n${ANSI.dim};; Query time: via DoH${ANSI.reset}\n`;
    o += `${ANSI.dim};; SERVER: dns.google#443${ANSI.reset}\n`;
    o += `${ANSI.dim};; WHEN: ${new Date().toUTCString()}${ANSI.reset}\n`;

    o += insights(await digInsights(domain, recordType, data));
    return o;
}

// Re-export digInsights for external consumers
export { digInsights } from "./dig-insights.js";
