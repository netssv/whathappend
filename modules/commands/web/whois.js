/**
 * @module modules/commands/web/whois.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, toRegisteredDomain, isIPAddress, cmdUsage, workerError, cmdError from '../../formatter.js'
 *     - extractRegistrar, extractExpiry from './whois-parser.js'
 *     - getConfig from '../util/config.js'
 * - Exports: cmdWhois
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import { ANSI, insights, resolveTargetDomain, toRegisteredDomain, isIPAddress, cmdUsage, workerError, cmdError } from "../../formatter.js";
import { extractRegistrar, extractExpiry } from "./whois-parser.js";
import { getConfig } from "../util/config.js";

// ===================================================================
// whois — Terminal command (client layer)
//
// Pure command logic: input validation, message passing, output formatting.
// All heuristic extraction is delegated to whois-parser.js.
// ===================================================================

// ---------------------------------------------------------------------------
// Domain WHOIS — RDAP
// ---------------------------------------------------------------------------

export async function cmdWhois(args, flags = []) {
    const info = {};
    const raw = resolveTargetDomain(args[0], info);
    if (!raw) return cmdUsage("whois", "<domain|ip>");
    if (isIPAddress(raw)) return ipWhois(raw, flags);

    const domain = toRegisteredDomain(raw);
    const isShort = flags.includes("--short");

    const resp = await chrome.runtime.sendMessage({ command: "whois", payload: { domain } });
    if (!resp) return workerError();
    if (resp.error) return handleWhoisError(resp.error, domain, isShort);

    const isExpert = await getConfig("expert-mode");
    if (isExpert && !isShort) {
        return `> whois ${domain}\n${ANSI.dim}${JSON.stringify(resp.data, null, 2)}${ANSI.reset}\n`;
    }

    return isShort
        ? formatShort(resp.data, domain)
        : formatFull(resp.data, domain);
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

function handleWhoisError(error, domain, isShort) {
    if (!error.includes("404") && !error.includes("failed with HTTP")) return cmdError(error);
    if (isShort) return ""; // silent fail for auto-target flow

    const tld = domain.split(".").slice(1).join(".");
    let o = `> whois ${domain}\n`;
    o += `${ANSI.yellow}[WARN] .${tld} registry does not support RDAP.${ANSI.reset}\n`;
    o += `${ANSI.dim}Many country-code TLDs (ccTLDs) don't have RDAP endpoints.${ANSI.reset}\n`;
    o += insights([
        { level: "INFO", text: `Lookup WHOIS: https://www.whois.com/whois/${domain}` },
        { level: "INFO", text: `Alternative: https://who.is/whois/${domain}` },
    ]);
    return o;
}

// ---------------------------------------------------------------------------
// Short Format (--short) — for auto-target header display
// ---------------------------------------------------------------------------

function formatShort(d) {
    const registrar = extractRegistrar(d);
    const expDate = extractExpiry(d);
    let o = `  ${ANSI.white}Registrar:${ANSI.reset} ${registrar}\n`;

    if (expDate) {
        const dd = daysUntil(expDate);
        const ec = dd < 0 ? ANSI.red : dd < 30 ? ANSI.yellow : ANSI.green;
        const label = dd < 0 ? `EXPIRED ${Math.abs(dd)}d ago` : `${dd}d remaining`;
        o += `  ${ANSI.white}Expiry:${ANSI.reset}    ${ec}${expDate}${ANSI.reset} ${ANSI.dim}(${label})${ANSI.reset}`;
    } else {
        o += `  ${ANSI.white}Expiry:${ANSI.reset}    ${ANSI.dim}Not available${ANSI.reset}`;
    }
    return o;
}

// ---------------------------------------------------------------------------
// Full Format — detailed WHOIS output
// ---------------------------------------------------------------------------

function formatFull(d, domain) {
    let o = `> whois ${domain}\n`;
    o += `Domain Name: ${(d.ldhName || domain).toUpperCase()}\n`;
    if (d.handle) o += `${ANSI.white}Registry Domain ID: ${ANSI.reset}${d.handle}\n`;

    o += formatStatuses(d.status);
    o += formatNameservers(d.nameservers);
    o += formatEvents(d.events);

    const registrar = extractRegistrar(d);
    o += `${ANSI.white}Registrar: ${ANSI.reset}${registrar}\n`;
    o += formatEntities(d.entities);
    o += formatInsights(d, domain);
    return o;
}

function formatStatuses(statuses) {
    if (!statuses?.length) return "";
    let o = "";
    for (const s of statuses) {
        const c = s.includes("delete") || s.includes("redemption") ? ANSI.red
                : s.includes("hold") ? ANSI.yellow : ANSI.green;
        o += `${ANSI.white}Domain Status: ${c}${s}${ANSI.reset}\n`;
    }
    return o;
}

function formatNameservers(nameservers) {
    if (!nameservers?.length) return "";
    let o = "";
    for (const ns of nameservers) {
        o += `${ANSI.white}Name Server: ${ANSI.cyan}${(ns.ldhName || ns).toUpperCase()}${ANSI.reset}\n`;
    }
    return o;
}

function formatEvents(events) {
    if (!events?.length) return "";
    let o = "";
    for (const ev of events) {
        if (ev.eventAction === "registration")   o += `${ANSI.white}Creation Date: ${ANSI.green}${ev.eventDate}${ANSI.reset}\n`;
        else if (ev.eventAction === "expiration") o += `${ANSI.white}Expiry Date: ${ANSI.reset}${ev.eventDate}\n`;
        else if (ev.eventAction === "last changed") o += `${ANSI.white}Updated Date: ${ANSI.reset}${ev.eventDate}\n`;
    }
    return o;
}

function formatEntities(entities) {
    if (!entities?.length) return "";
    let o = "";
    for (const e of entities) {
        const roles = (e.roles || []).join(", ");
        if (roles.includes("registrar")) continue; // already shown via extractRegistrar
        let name = e.handle || "N/A";
        if (e.vcardArray?.[1]) {
            for (const p of e.vcardArray[1]) { if (p[0] === "fn") name = p[3] || name; }
        }
        o += `${ANSI.white}${roles.charAt(0).toUpperCase() + roles.slice(1)}: ${ANSI.reset}${name}\n`;
    }
    return o;
}

function formatInsights(d, domain) {
    const ins = [];
    const expDate = extractExpiry(d);
    if (expDate) {
        const dd = daysUntil(expDate);
        if (dd < 0)       ins.push({ level: "CRIT", text: `Expired ${Math.abs(dd)} days ago.` });
        else if (dd < 30) ins.push({ level: "CRIT", text: `Expires in ${dd} days.` });
        else if (dd < 90) ins.push({ level: "WARN", text: `Expires in ${dd} days.` });
        else              ins.push({ level: "PASS", text: `Expires in ${dd} days.` });
    }

    const regEv = d.events?.find(e => e.eventAction === "registration");
    if (regEv) {
        const dd = daysAgo(regEv.eventDate);
        const y = Math.floor(dd / 365);
        if (dd < 90) ins.push({ level: "WARN", text: `Only ${dd} days old. Low trust.` });
        else ins.push({ level: "INFO", text: `Age: ${y}y (${dd}d). ${y >= 2 ? "Established." : "Building reputation."}` });
    }

    ins.push({ level: "INFO", text: `External Check: https://www.whois.com/whois/${domain}` });
    return insights(ins);
}

// ---------------------------------------------------------------------------
// IP WHOIS — RDAP /ip/ endpoint
// ---------------------------------------------------------------------------

async function ipWhois(ip, flags) {
    const isShort = flags.includes("--short");
    const resp = await chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip } });
    if (!resp) return workerError();
    if (resp.error) return cmdError(`IP WHOIS failed for ${ip}\n${ANSI.dim}${resp.error}`);

    const org = resp.org || "Unknown";
    if (isShort) return `  ${ANSI.white}Owner:${ANSI.reset} ${org}`;

    let o = `> whois ${ip}\n`;
    o += `${ANSI.white}IP Address:${ANSI.reset} ${ip}\n`;
    o += `${ANSI.white}Organization:${ANSI.reset} ${org}\n`;
    o += insights([
        { level: "INFO", text: `Owner: ${org}` },
        { level: "INFO", text: `External Check: https://www.whois.com/whois/${ip}` },
    ]);
    return o;
}

// ---------------------------------------------------------------------------
// Date Utilities
// ---------------------------------------------------------------------------

function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

function daysAgo(dateStr) {
    return Math.floor((new Date() - new Date(dateStr)) / 864e5);
}
