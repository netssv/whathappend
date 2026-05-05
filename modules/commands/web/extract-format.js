/**
 * @module modules/commands/web/extract-format.js
 * @description Shared formatting utilities for the extract command.
 */

import { ANSI } from "../../formatter.js";

/** OSC 8 clickable hyperlink. */
export function linkify(url, label) {
    return `\x1b]8;;${url}\x07${label || url}\x1b]8;;\x07`;
}

/** Extract file extension (uppercase) from URL. */
export function extTag(url) {
    const m = url.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
    return m ? m[1].toUpperCase() : "";
}

/** Color code for a file extension. */
export function extColor(ext) {
    const map = {
        JPG: ANSI.yellow, JPEG: ANSI.yellow, PNG: ANSI.cyan, GIF: ANSI.magenta,
        WEBP: ANSI.green, SVG: ANSI.blue, AVIF: ANSI.green,
        PDF: ANSI.red, DOC: ANSI.blue, DOCX: ANSI.blue,
        XLS: ANSI.green, XLSX: ANSI.green, CSV: ANSI.green,
    };
    return map[ext] || ANSI.dim;
}

/** Truncate string with ellipsis. */
export function trunc(str, max = 38) {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/** Clean filename from URL. */
export function fileName(url) {
    try { return decodeURIComponent(url.split('/').pop().split('?')[0].split('#')[0]) || url; }
    catch { return url; }
}

/** Section header with title, host, and optional count. */
export function header(title, host, count) {
    let o = `\n${ANSI.cyan}${ANSI.bold}  ${title}${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
    o += `  ${ANSI.dim}${"━".repeat(28)}${ANSI.reset}\n`;
    if (count !== undefined) o += `  ${ANSI.white}${count} result(s)${ANSI.reset}\n\n`;
    return o;
}

/** Copy raw text to clipboard. Returns status line. */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return `  ${ANSI.green}✓ Copied to clipboard${ANSI.reset} ${ANSI.dim}(${text.split('\n').length} lines)${ANSI.reset}\n`;
    } catch {
        return `  ${ANSI.red}✗ Clipboard write failed${ANSI.reset}\n`;
    }
}

/** Numbered list for simple items (emails, phones). */
export function numberedList(items, emptyMsg) {
    if (!items.length) return `  ${ANSI.yellow}${emptyMsg}${ANSI.reset}\n`;
    return items.map((item, i) =>
        `  ${ANSI.dim}${`${i + 1}`.padStart(2)}.${ANSI.reset} ${ANSI.white}${item}${ANSI.reset}`
    ).join("\n") + "\n";
}

/** Numbered list for URL items with extension tags. */
export function fileList(items, emptyMsg) {
    if (!items.length) return `  ${ANSI.yellow}${emptyMsg}${ANSI.reset}\n`;
    return items.map((url, i) => {
        const name = trunc(fileName(url));
        const ext = extTag(url);
        const tag = ext ? ` ${extColor(ext)}[${ext}]${ANSI.reset}` : "";
        return `  ${ANSI.dim}${`${i + 1}`.padStart(2)}.${ANSI.reset} ${linkify(url, name)}${tag}`;
    }).join("\n") + "\n";
}

/** Clip hint line. */
export const CLIP_HINT = `\n  ${ANSI.dim}Tip: add ${ANSI.white}--clip${ANSI.dim} to copy all URLs${ANSI.reset}\n`;
