/**
 * @module modules/commands/stack/stack.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError from '../../formatter.js'
 *     - detectTechnologies from './detector.js'
 *     - formatStackOutput from './formatter.js'
 * - Exports: cmdStack
 * - Layer: Command Layer (Stack) - Tech stack identification.
 */

import {ANSI, resolveTargetDomain, formatError, cmdUsage, cmdError, workerError, getLiveDomNote } from "../../formatter.js";
import { detectTechnologies } from "./detector.js";
import { formatStackOutput } from "./formatter.js";

// ===================================================================
//  stack / tech — Main Command
// ===================================================================

export async function cmdStack(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("stack", "<domain>");

    let o = `> stack ${domain}\n`;
    o += `${ANSI.dim}Detecting technology stack...${ANSI.reset}\n\n`;

    let html = "";
    let headers = {};
    let fetchMethod = "";
    let isLive = false;

    // ── Step 1: Get HTML ──
    try {
        // Try live DOM first (active tab) for richer detection
        if (info.autoTargeted) {
            const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
            if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
                html = domResp.data.html.toLowerCase();
                fetchMethod = "Live DOM (active tab)";
                isLive = true;
            }
        }

        if (!html) {
            const resp = await chrome.runtime.sendMessage({
                command: "fetch-text",
                payload: { url: `https://${domain}` },
            });
            if (resp?.success) {
                html = (resp.data?.text || "").toLowerCase();
                fetchMethod = "Static HTML (remote fetch)";
            }
        }
    } catch (_) { /* non-fatal */ }

    // ── Step 2: Get HTTP Headers ──
    try {
        const headResp = await chrome.runtime.sendMessage({
            command: "http-headers",
            payload: { url: domain },
        });
        if (headResp?.success && headResp.data?.headers) {
            headers = headResp.data.headers;
        }
    } catch (_) { /* non-fatal */ }

    if (!html && Object.keys(headers).length === 0) {
        return o + formatError(
            "FETCH_FAILURE",
            "Could not fetch page content or headers.",
            "Verify the domain is accessible.",
            `https://builtwith.com/${encodeURIComponent(domain)}`
        );
    }

    let liveDomInsight = null;
    if (!isLive) {
        liveDomInsight = await getLiveDomNote(domain);
    }

    const { foundCMS, foundFrameworks, foundServers, headersLower } = detectTechnologies(html, headers);
    return o + formatStackOutput({ domain, foundCMS, foundFrameworks, foundServers, headers, headersLower, fetchMethod, liveDomInsight });
}
