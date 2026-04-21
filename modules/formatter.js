/**
 * WhatHappened — Shared Formatter & Utilities
 *
 * ANSI color codes, insights renderer, IP detection,
 * domain resolution, and target validation.
 */

import { ContextManager } from "./context.js";
import { REGEX } from "./data/constants.js";

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

export function getSeparator(char = "━", len = 50) {
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
    let o = `\n${ANSI.red}[${type}]${ANSI.reset}`;
    o += `\n${ANSI.white}What happened:${ANSI.reset} ${what}`;
    if (suggestion) o += `\n${ANSI.yellow}Suggestion:${ANSI.reset} ${suggestion}`;
    if (link) o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}${link}${ANSI.reset}`;
    return o;
}

export function cmdUsage(cmd, syntax) {
    return `${ANSI.red}Usage: ${cmd} ${syntax}${ANSI.reset}`;
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
