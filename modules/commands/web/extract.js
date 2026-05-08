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

/** Specialised runner for -images: enriches output with DOM + Performance data. */
async function runImages(clip) {
    const tab = await getActiveTab();
    if (!tab) return `${ANSI.red}[ERROR] Must be on an HTTP/HTTPS page.${ANSI.reset}`;

    const [{ result: items }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeImages });
    const imgList = items || [];

    // Enrich with DOM broken-image data + Performance API bytes
    let extra = {};
    try {
        const [{ result: dom }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const els = Array.from(document.querySelectorAll("img"));
                const broken = els.filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:"));
                const res = performance.getEntriesByType("resource");
                let imgBytes = 0, totalBytes = 0;
                for (const r of res) {
                    const sz = r.transferSize || r.encodedBodySize || 0;
                    totalBytes += sz;
                    if (r.initiatorType === "img" || r.initiatorType === "image") imgBytes += sz;
                }
                const nav = (performance.getEntriesByType("navigation") || [])[0] || {};
                const docSz = nav.transferSize || nav.encodedBodySize || 0;
                return {
                    imgBroken: broken.length,
                    brokenUrls: broken.slice(0, 5).map(e => e.src),
                    imgBytes,
                    pageWeight: totalBytes + docSz,
                };
            },
        });
        extra = dom || {};
    } catch {}

    let o = header("Image Extractor", host(tab), imgList.length);
    o += fmtImages(imgList, extra);
    if (clip && imgList.length) o += await copyToClipboard(imgList.join('\n'));
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

function fmtImages(items, extra = {}) {
    if (!items.length) return `  ${ANSI.yellow}No images found.${ANSI.reset}\n` + CLIP_HINT;

    // Extension count summary
    const counts = {};
    for (const url of items) { const e = extTag(url) || "OTHER"; counts[e] = (counts[e] || 0) + 1; }
    const summary = Object.entries(counts).sort((a, b) => b[1] - a[1])
        .map(([e, c]) => `${extColor(e)}${e}${ANSI.reset}:${c}`).join("  ");

    let o = `  ${summary}\n\n`;

    // Broken images (from DOM scan)
    if (extra.imgBroken > 0) {
        o += `  ${ANSI.red}[BROKEN] ${extra.imgBroken} image(s) failed to load:${ANSI.reset}\n`;
        for (const url of (extra.brokenUrls || [])) {
            o += `    ${ANSI.red}✗${ANSI.reset} ${ANSI.dim}${trunc(url, 50)}${ANSI.reset}\n`;
        }
        if (extra.imgBroken > (extra.brokenUrls?.length || 0)) {
            o += `    ${ANSI.dim}… +${extra.imgBroken - (extra.brokenUrls?.length || 0)} more${ANSI.reset}\n`;
        }
        o += `\n`;
    }

    // Image transfer weight from Performance API
    if (extra.imgBytes > 0) {
        const pct = extra.pageWeight > 0 ? Math.round((extra.imgBytes / extra.pageWeight) * 100) : 0;
        o += `  ${ANSI.dim}Image weight:${ANSI.reset} ${ANSI.blue}${fmtBytes(extra.imgBytes)}${ANSI.reset}`;
        if (pct > 0) o += ` ${ANSI.dim}(${pct}% of page)${ANSI.reset}`;
        o += `\n\n`;
    }

    return o + fileList(items, "") + CLIP_HINT;
}

function fmtBytes(b) {
    if (!b || b <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB"]; let i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return `${b.toFixed(i > 0 ? 1 : 0)} ${u[i]}`;
}

// ── Flag → handler map ───────────────────────────────────────────────────────

const HANDLERS = {
    "-emails":   (c) => run(scrapeEmails,  "Email Extractor",    fmtSimple("No emails detected."), c),
    "-phones":   (c) => run(scrapePhones,  "Phone Extractor",    fmtSimple("No phone numbers detected."), c),
    "-links":    (c) => run(scrapeLinks,   "Link Extractor",     fmtLinks, c),
    "-images":   (c) => runImages(c),
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
