/**
 * @module modules/formatter.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ContextManager from './context.js'
 *     - REGEX from './data/constants.js'
 *     - getTermCols from './state.js'
 * - Exports: ANSI, getSeparator, insights, formatError, cmdUsage, cmdError, workerError, resolveTargetDomain, toRegisteredDomain, toApex, resolveBaseDomain, isIPAddress, ipNotAllowedError, loadImpactData, generateImpactSection
 * - Layer: Shared Utility / Router - Common functions or central engine index used across the app.
 */

/**
 * WhatHappened — Shared Formatter & Utilities
 *
 * ANSI color codes, insights renderer, IP detection,
 * domain resolution, and target validation.
 */

import { ContextManager } from "./context.js";
import { REGEX } from "./data/constants.js";
import { getTermCols } from "./state.js";

// ---------------------------------------------------------------------------
// ANSI Color Constants
// ---------------------------------------------------------------------------

export const ANSI = {
    reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
    green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
    blue: "\x1b[34m", cyan: "\x1b[36m", magenta: "\x1b[35m",
    white: "\x1b[37m", gray: "\x1b[90m",
};

// ---------------------------------------------------------------------------
// Insights Renderer — [PASS] [WARN] [CRIT] [INFO]
// ---------------------------------------------------------------------------

export function getSeparator(char = "━", forcedLen = null) {
    const cols = getTermCols();
    // Adapt to terminal width dynamically
    const len = forcedLen || Math.max(20, cols - 2);
    return `${ANSI.dim}${char.repeat(len)}${ANSI.reset}`;
}

export function insights(list) {
    if (!list?.length) return "";
    const seen = new Set();
    let o = `${ANSI.dim}── INSIGHTS ──${ANSI.reset}`;
    for (const i of list) {
        if (seen.has(i.text)) continue;
        seen.add(i.text);
        const c = i.level==="CRIT"?ANSI.red:i.level==="WARN"?ANSI.yellow:i.level==="PASS"?ANSI.green:ANSI.cyan;
        o += `\n${c}[${i.level}]${ANSI.reset} ${i.text}`;
    }
    return o;
}

// ---------------------------------------------------------------------------
// Standardized Error Display — ITIL-Lite
// ---------------------------------------------------------------------------

export function formatError(type, what, suggestion, link) {
    let t = type;
    let w = what;
    let s = suggestion;
    let l = link;

    if (w.includes("Failed to fetch") || w.includes("ERR_CONNECTION_REFUSED")) {
        t = "OFFLINE";
        w = "The server is not responding to the HTTPS handshake.";
        s = "Verify if the server is down or blocking connections.";
        l = "https://www.isitdownrightnow.com/";
    } else if (w.includes("ERR_NAME_NOT_RESOLVED") || w.includes("NXDOMAIN")) {
        t = "DNS_ERROR";
        w = "The domain does not resolve (NXDOMAIN).";
        s = "Verify the domain syntax or check DNS propagation.";
        l = "https://mxtoolbox.com/dnscheck.aspx";
    } else if (w.includes("Timeout") || w.includes("AbortError") || w.includes("cancelled")) {
        t = "TIMEOUT";
        w = "The response took longer than the 5-second timeout limit.";
        s = "Try again; the network might be congested or the site is blocking requests.";
        l = "https://mxtoolbox.com/NetworkTools.aspx";
    }

    let o = `\n${ANSI.red}[${t}]${ANSI.reset}`;
    o += `\n${ANSI.white}What happened:${ANSI.reset} ${w}`;
    if (s) o += `\n${ANSI.yellow}Suggestion:${ANSI.reset} ${s}`;
    if (l) o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}${l}${ANSI.reset}`;
    return o;
}

export function cmdUsage(cmd, syntax) {
    let example = "google.com";
    if (syntax.includes("<ip>") || syntax.includes("[ip]")) example = "8.8.8.8";
    else if (cmd === "config" || cmd === "settings") example = "timeout 5000";
    else if (cmd === "tabs" || cmd === "tab") example = "list";
    else if (cmd === "notes" || cmd === "note") example = "Check this later";
    else if (cmd === "export") example = "json";
    else if (cmd === "target") example = "example.com";

    return `${ANSI.red}Usage: ${cmd} ${syntax}${ANSI.reset}\n${ANSI.dim}Example: ${cmd} ${example}${ANSI.reset}`;
}

export function cmdError(message) {
    return `${ANSI.red}[ERROR] ${message}${ANSI.reset}`;
}

export function workerError(msg = "No response from background worker.") {
    return `${ANSI.red}[ERROR] ${msg}${ANSI.reset}`;
}

// ---------------------------------------------------------------------------
// Target Resolution
// ---------------------------------------------------------------------------

export function resolveTargetDomain(arg, out) {
    if (arg) { if (out) out.autoTargeted = false; return arg.replace(REGEX.URL_PROTOCOL, "").replace(REGEX.URL_PATH, ""); }
    const ctx = ContextManager.getDomain();
    if (ctx) { if (out) out.autoTargeted = true; return ctx.replace(REGEX.URL_PROTOCOL, "").replace(REGEX.URL_PATH, ""); }
    return null;
}

export function toRegisteredDomain(h) {
    if (isIPAddress(h)) return h;
    const p = h.replace(REGEX.TRAILING_DOT, "").split(".");
    if (p.length <= 2) return h;
    const cc = ["co.uk","com.br","com.au","co.jp","co.kr","com.mx","org.uk","net.au","gob.sv","gov.br","gov.co","edu.sv","gob.mx","gov.uk","com.sv","org.sv","net.sv"];
    if (cc.includes(p.slice(-2).join("."))) return p.slice(-3).join(".");
    return p.slice(-2).join(".");
}

/**
 * Normalize a domain to its apex (registerable) form.
 * Strips protocol, path, trailing dots, then delegates to toRegisteredDomain()
 * for ccTLD-aware extraction.
 *
 *   www.facebook.com        → facebook.com
 *   dev.api.example.co.uk   → example.co.uk
 *   courriel.easyhosting.com → easyhosting.com
 *
 * @param {string} domain — raw domain input (may include protocol/path)
 * @returns {string} apex domain
 */
export function toApex(domain) {
    if (!domain || isIPAddress(domain)) return domain;
    const d = domain
        .replace(REGEX.URL_PROTOCOL, "")
        .replace(REGEX.URL_PATH, "")
        .replace(REGEX.TRAILING_DOT, "");
    return toRegisteredDomain(d);
}

export function resolveBaseDomain(args, cmdName) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return { error: cmdUsage(cmdName, "<domain>") };
    if (isIPAddress(domain)) return { error: ipNotAllowedError(cmdName) };
    return { domain, baseDomain: toRegisteredDomain(domain), info };
}

// ---------------------------------------------------------------------------
// IP Detection
// ---------------------------------------------------------------------------

export function isIPAddress(target) {
    if (!target) return false;
    if (REGEX.IP_V4.test(target)) return true;
    if (REGEX.IP_V6.test(target) && target.includes(":")) return true;
    return false;
}

export function ipNotAllowedError(cmd) {
    return `${ANSI.red}[ERROR] '${cmd}' requires a domain name, not an IP address.${ANSI.reset}
${ANSI.dim}DNS record lookups (SPF, DKIM, DMARC) are tied to domain names.${ANSI.reset}
${ANSI.dim}Use ${ANSI.white}rev-dns${ANSI.dim} to find the domain for an IP, then retry.${ANSI.reset}`;
}

// ---------------------------------------------------------------------------
// Business Impact
// ---------------------------------------------------------------------------

let impactData = null;

export async function loadImpactData() {
    if (impactData) return impactData;
    try { const r = await fetch(chrome.runtime.getURL("data/impact-data.json")); impactData = await r.json(); return impactData; } catch(_){return null;}
}

export async function generateImpactSection(cat, raw) {
    const d = await loadImpactData(); if (!d) return null;
    const map={dig:"dns",curl:"http",openssl:"ssl",whois:"whois"};
    const c=map[cat]; if(!c||!d[c]) return null;
    const cl=raw.replace(REGEX.ANSI_STRIP,"").toLowerCase();
    const m=d[c].filter(e=>cl.includes(e.pattern.toLowerCase()));
    if (!m.length) return null;
    let s=`${ANSI.magenta}${ANSI.bold}[BUSINESS IMPACT]${ANSI.reset}\n${ANSI.dim}${"=".repeat(34)}${ANSI.reset}\n\n`;
    for(const i of m){const col=i.severity==="high"?ANSI.red:i.severity==="medium"?ANSI.yellow:ANSI.cyan;s+=`  ${col}[${i.severity.toUpperCase()}]${ANSI.reset} ${i.pattern}\n  ${ANSI.dim}Impact:${ANSI.reset} ${i.business_impact}\n  ${ANSI.dim}Action:${ANSI.reset} ${ANSI.green}${i.recommendation}${ANSI.reset}\n\n`;}
    return s;
}
