/**
 * @module modules/core/triage-retries.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - updateWhoisFields, updateNSField, updateHostField, markFieldRetryable from '../terminal/header-controller.js'
 *     - setSessionTriad from '../state.js'
 *     - resolveProvider, isRdapMaintainer, getProviderFromCNAME from '../utils.js'
 * - Exports: retryEmptyHeaderFields
 * - Layer: Core Layer (Engine) - Central triaging, parsing, and execution routing.
 */

import { markFieldRetryable } from "../terminal/header-controller.js";
import { retryRegistrar, retryNS, retryWebHost } from "./triage-retries-infra.js";
import { resolveIPGeoRow, resolveSSLCDNRow } from "./triage-resolvers-ext.js";
import { resolveMyIPRow, resolveMXRow } from "./triage-resolvers-mail.js";

// ---------------------------------------------------------------------------
// Background Header Retry — Best-effort for empty triad fields
// 
// WORKFLOW EXPLANATION:
// 1. Initial Triage: fallback.js calls progressive-renderer and resolves initial data.
// 2. Background Retry: Once terminal is ready, it calls retryEmptyHeaderFields()
//    to silently attempt to resolve any fields that failed (e.g., DNS timeouts).
// 3. User Retry: If background fails, fields are marked retryable (↻ icon).
//    When clicked, header-retry.js calls these exact same resolver functions, 
//    but handles the UI loading state directly.
// ---------------------------------------------------------------------------

const RETRY_TIMEOUT = 15000;
let _retryGeneration = 0;

export function retryEmptyHeaderFields(domain, apexDomain, resolved) {
    const missing = [];
    if (!resolved.registrar) missing.push("registrar");
    if (!resolved.ns) missing.push("ns");
    if (!resolved.webhost) missing.push("webhost");
    if (!resolved.ip) missing.push("ip");
    if (!resolved.myip) missing.push("myip");
    if (!resolved.ssl) missing.push("ssl");
    if (!resolved.cdn) missing.push("cdn");
    if (!resolved.http) missing.push("http");
    if (!resolved.mx) missing.push("mx");
    if (missing.length === 0) return;

    // Increment generation — any in-flight retries from a previous target
    // will see a stale generation and discard their results
    const gen = ++_retryGeneration;

    // Fire-and-forget — no terminal output, only header updates
    for (const field of missing) {
        try {
            if (field === "registrar") {
                retryRegistrar(apexDomain, isStale, gen);
            } else if (field === "ns") {
                retryNS(domain, isStale, gen);
            } else if (field === "webhost") {
                retryWebHost(domain, isStale, gen);
            } else if (field === "ip") {
                retryIPGeo(domain, gen);
            } else if (field === "myip") {
                retryMyIP(gen);
            } else if (field === "ssl" || field === "http" || field === "cdn") {
                retrySSLCDN(domain, gen);
            } else if (field === "mx") {
                retryMXDNS(apexDomain, gen);
            }
        } catch (e) {
            console.warn(`[WH] Failed to init retry for ${field}:`, e);
        }
    }
}

function isStale(gen) { return gen !== _retryGeneration; }

// ---------------------------------------------------------------------------
// Retry: IP + GEO — reuses the extended resolver with null renderer (bg mode)
// ---------------------------------------------------------------------------

async function retryIPGeo(domain, gen) {
    try {
        const res = await resolveIPGeoRow(null, domain);
        if (isStale(gen)) return;
        if (res?.error) {
            if (!res?.ip) markFieldRetryable("ip");
            if (!res?.geo) markFieldRetryable("geo");
        }
    } catch (_) {
        if (!isStale(gen)) {
            markFieldRetryable("ip");
            markFieldRetryable("geo");
        }
    }
}

// ---------------------------------------------------------------------------
// Retry: SSL + CDN — reuses the extended resolver with null renderer (bg mode)
// ---------------------------------------------------------------------------

async function retrySSLCDN(domain, gen) {
    try {
        const res = await resolveSSLCDNRow(null, domain);
        if (isStale(gen)) return;
        if (res?.error) {
            if (!res?.ssl) markFieldRetryable("ssl");
            if (!res?.cdn) markFieldRetryable("cdn");
            if (!res?.http) markFieldRetryable("http");
        }
    } catch (_) {
        if (!isStale(gen)) {
            markFieldRetryable("ssl");
            markFieldRetryable("cdn");
            markFieldRetryable("http");
        }
    }
}

// ---------------------------------------------------------------------------
// Retry: MY IP — reuses the extended resolver
// ---------------------------------------------------------------------------

async function retryMyIP(gen) {
    try {
        const res = await resolveMyIPRow(null);
        if (isStale(gen)) return;
        if (res?.error) markFieldRetryable("myip");
    } catch (_) {
        if (!isStale(gen)) markFieldRetryable("myip");
    }
}

// ---------------------------------------------------------------------------
// Retry: MX + DNS — reuses the extended resolver
// ---------------------------------------------------------------------------

async function retryMXDNS(apexDomain, gen) {
    try {
        const res = await resolveMXRow(null, apexDomain);
        if (isStale(gen)) return;
        if (res?.error) markFieldRetryable("mx");
    } catch (_) {
        if (!isStale(gen)) markFieldRetryable("mx");
    }
}


