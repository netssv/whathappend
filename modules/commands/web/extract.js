/**
 * @module modules/commands/web/extract.js
 * @description Unified content extraction command orchestrator.
 *
 * Usage: extract <flag> [--clip]
 *   -emails, -phones, -links, -images, -docs, -comments
 *
 * @connections
 * - Imports: extract-scrapers (DOM injectors), extract-format (display helpers)
 * - Exports: cmdExtract
 * - Layer: Command Layer (Web)
 */

import { ANSI } from "../../formatter.js";
import {
    scrapeEmails, scrapePhones, scrapeLinks,
    scrapeImages, scrapeDocs
} from "./extract-scrapers.js";
import {
    header, numberedList, fileList, linkify, trunc,
    fileName, extTag, extColor, copyToClipboard, CLIP_HINT
} from "./extract-format.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url?.startsWith("http") ? tab : null;
}

function host(tab) {
    try { return new URL(tab.url).hostname; } catch { return "Page"; }
}

/** Generic: run scraper → format → optional clip. */
async function run(scraper, title, formatter, clip) {
    const tab = await getActiveTab();
    if (!tab) return `${ANSI.red}[ERROR] Must be on an HTTP/HTTPS page.${ANSI.reset}`;
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scraper });
    const items = result || [];
    let o = header(title, host(tab), items.length) + formatter(items);
    if (clip && items.length) o += await copyToClipboard(items.join('\n'));
    return o + "\n";
}

// ── Formatters (how each type renders its results) ───────────────────────────

const fmtSimple = (empty) => (items) => numberedList(items, empty);
const fmtFiles  = (empty) => (items) => fileList(items, empty) + CLIP_HINT;

function fmtLinks(items) {
    if (!items.length) return `  ${ANSI.yellow}No absolute links found.${ANSI.reset}\n` + CLIP_HINT;
    const byDomain = {};
    for (const url of items) {
        try { const h = new URL(url).hostname; (byDomain[h] ||= []).push(url); }
        catch { (byDomain["other"] ||= []).push(url); }
    }
    let o = "";
    const domains = Object.keys(byDomain).sort((a, b) => byDomain[b].length - byDomain[a].length);
    for (const d of domains) {
        const urls = byDomain[d];
        o += `  ${ANSI.cyan}${d}${ANSI.reset} ${ANSI.dim}(${urls.length})${ANSI.reset}\n`;
        for (const url of urls.slice(0, 8)) {
            const name = trunc(fileName(url));
            const ext = extTag(url);
            const tag = ext ? ` ${extColor(ext)}[${ext}]${ANSI.reset}` : "";
            o += `    ${ANSI.dim}›${ANSI.reset} ${linkify(url, name)}${tag}\n`;
        }
        if (urls.length > 8) o += `    ${ANSI.dim}  … +${urls.length - 8} more${ANSI.reset}\n`;
    }
    return o + CLIP_HINT;
}

function fmtImages(items) {
    if (!items.length) return `  ${ANSI.yellow}No images found.${ANSI.reset}\n` + CLIP_HINT;
    // Extension summary
    const counts = {};
    for (const url of items) { const e = extTag(url) || "OTHER"; counts[e] = (counts[e] || 0) + 1; }
    const summary = Object.entries(counts).sort((a, b) => b[1] - a[1])
        .map(([e, c]) => `${extColor(e)}${e}${ANSI.reset}:${c}`).join("  ");
    return `  ${summary}\n\n` + fileList(items, "") + CLIP_HINT;
}

// ── Flag → handler map ───────────────────────────────────────────────────────

const HANDLERS = {
    "-emails":   (c) => run(scrapeEmails,  "Email Extractor",    fmtSimple("No emails detected."), c),
    "-phones":   (c) => run(scrapePhones,  "Phone Extractor",    fmtSimple("No phone numbers detected."), c),
    "-links":    (c) => run(scrapeLinks,   "Link Extractor",     fmtLinks, c),
    "-images":   (c) => run(scrapeImages,  "Image Extractor",    fmtImages, c),
    "-docs":     (c) => run(scrapeDocs,    "Document Extractor", fmtFiles("No document links found."), c),
    "-comments": ()  => import("./comments.js").then(m => m.cmdComments([])),
};

// Aliases
HANDLERS["-email"] = HANDLERS["-emails"];
HANDLERS["-phone"] = HANDLERS["-phones"];
HANDLERS["-link"]  = HANDLERS["-links"];
HANDLERS["-image"] = HANDLERS["-images"];
HANDLERS["-img"]   = HANDLERS["-images"];
HANDLERS["-doc"]   = HANDLERS["-docs"];

// ── Entry point ──────────────────────────────────────────────────────────────

export async function cmdExtract(args, flags = []) {
    const flag = flags.find(f => HANDLERS[f]) || args[0] || "";
    const clip = flags.includes("--clip") || flags.includes("--copy");

    if (HANDLERS[flag]) {
        try { return await HANDLERS[flag](clip); }
        catch (err) { return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`; }
    }

    // Usage help
    let o = `\n${ANSI.cyan}${ANSI.bold}  extract${ANSI.reset} ${ANSI.dim}— Page Content Extractor${ANSI.reset}\n`;
    o += `  ${ANSI.dim}${"━".repeat(28)}${ANSI.reset}\n`;
    o += `  ${ANSI.white}Usage:${ANSI.reset} extract ${ANSI.cyan}<flag>${ANSI.reset} ${ANSI.dim}[--clip]${ANSI.reset}\n\n`;
    o += `  ${ANSI.green}-emails${ANSI.reset}    ${ANSI.dim}Email addresses from the DOM${ANSI.reset}\n`;
    o += `  ${ANSI.green}-phones${ANSI.reset}    ${ANSI.dim}Phone numbers (tel: + regex)${ANSI.reset}\n`;
    o += `  ${ANSI.green}-links${ANSI.reset}     ${ANSI.dim}All absolute href/src URLs${ANSI.reset}\n`;
    o += `  ${ANSI.green}-images${ANSI.reset}    ${ANSI.dim}All <img> source URLs${ANSI.reset}\n`;
    o += `  ${ANSI.green}-docs${ANSI.reset}      ${ANSI.dim}Document files (.pdf, .doc, .xls…)${ANSI.reset}\n`;
    o += `  ${ANSI.green}-comments${ANSI.reset}  ${ANSI.dim}Hidden HTML/JS comments${ANSI.reset}\n`;
    o += `\n  ${ANSI.dim}Add ${ANSI.white}--clip${ANSI.dim} to copy results to clipboard.${ANSI.reset}\n`;
    return o + "\n";
}
