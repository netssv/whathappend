/**
 * @module modules/utils-tui.js
 * @description TUI rendering primitives: text wrapping, block rendering, hitbox detection.
 *              All functions are stateless and accept explicit cols/rowMap arguments.
 *
 * @connections
 * - Imports: stripANSI from './utils-domain.js'
 * - Exports: wrapAnsiText, buildPageDots, renderMenuBlock, getMenuActionAt
 * - Layer: Shared Utility — view helpers used by all TUI renderers.
 */

import { stripANSI } from "./utils-domain.js";

// ── Text Wrapping ─────────────────────────────────────────────────────

/**
 * Wraps text at word boundaries preserving ANSI codes and leading indentation.
 */
export function wrapAnsiText(str, cols) {
    const stripped = stripANSI(str);
    if (stripped.length <= cols) return [str];

    const indent    = (stripped.match(/^(\s*)/) ?? ["", ""])[1];
    const indentLen = indent.length;

    let currentLine = "", currentLen = 0, activeAnsi = "";
    const resultLines = [];
    const tokens = str.split(/(\s+|\x1b\[[0-9;]*m)/g).filter(Boolean);

    for (const tok of tokens) {
        if (tok.startsWith("\x1b")) {
            activeAnsi = tok === "\x1b[0m" ? "" : activeAnsi + tok;
            currentLine += tok;
        } else if (/^\s+$/.test(tok)) {
            if (currentLen === 0 || currentLen + tok.length <= cols) {
                currentLine += tok; currentLen += tok.length;
            }
        } else {
            if (currentLen + tok.length > cols && currentLen > indentLen) {
                resultLines.push(currentLine + (activeAnsi ? "\x1b[0m" : ""));
                currentLine = indent + activeAnsi + tok;
                currentLen  = indentLen + tok.length;
            } else {
                currentLine += tok; currentLen += tok.length;
            }
        }
    }
    if (currentLen > 0) resultLines.push(currentLine + (activeAnsi ? "\x1b[0m" : ""));
    return resultLines;
}

// ── Page Dots ─────────────────────────────────────────────────────────

/**
 * Build a centered dot-progress line showing position in a sequence.
 * @param {number} current  1-based current page
 * @param {number} total    total pages
 * @param {number} cols     terminal width
 * @param {object} ANSI     ANSI color object
 * @returns {string}        ANSI string (no trailing newline)
 */
export function buildPageDots(current, total, cols, ANSI) {
    const dots = Array.from({ length: total }, (_, i) =>
        i === current - 1 ? "\x1b[1m●\x1b[22m" : "\x1b[2m·\x1b[22m"
    );
    // plain width: total dots + (total-1) spaces between
    const plainWidth = 2 * total - 1;
    const pad = Math.max(2, Math.floor((cols - plainWidth) / 2));
    return " ".repeat(pad) + dots.join(" ");
}

// ── Carousel Layout (single source of truth) ──────────────────────────

/**
 * Compute carousel geometry from the action object.
 * IMPORTANT: action.cols MUST be set by the builder at draw-time.
 * Both the renderer (via cols param) and the hitbox (via action.cols) call this
 * with the same effective cols so nextX is always in sync.
 *
 * @param {object} action  carousel action object (must include .cols)
 * @param {number} [overrideCols]  when passed by the renderer, overrides action.cols
 */
function carouselLayout(action, overrideCols) {
    const cols  = overrideCols ?? action.cols ?? 80;
    const { title, prefix } = action;
    const displayTitle = prefix ? `${prefix} | ${title}` : title;

    // Fixed chrome: 2 indent + 5 [< ] + 3 gap + 1 sp + title + 1 sp + 3 gap + 5 [>]
    const CHROME    = 2 + 5 + 3 + 1 + 1 + 3 + 5;
    const available = cols - CHROME;

    const safeTitle = displayTitle.length > available
        ? displayTitle.slice(0, available - 1) + "…"
        : displayTitle;

    // blockWidth = " safeTitle " = 1 + safeTitle.length + 1
    const blockWidth = 1 + safeTitle.length + 1;
    // nextX = start of [ > ] button
    const nextX = 2 + 5 + 3 + blockWidth + 3;

    return { safeTitle, nextX };
}

// ── Block Renderers ───────────────────────────────────────────────────

function renderGrid(action, hoveredAction, cols) {
    const { left, right, leftStr, rightStr, midX } = action;
    const highlight = (s, width) => {
        const padded = s.padEnd(width);
        return `\x1b[48;5;237m${padded.replace(/\x1b\[0m/g, "\x1b[0m\x1b[48;5;237m")}\x1b[0m`;
    };
    const lPart = hoveredAction === left  ? highlight(leftStr,  midX)       : leftStr.padEnd(midX);
    const rPart = hoveredAction === right ? highlight(rightStr, cols - midX) : rightStr;
    return lPart + rPart;
}

function renderCarousel(action, hoveredAction, cols, ANSI) {
    // Renderer passes its local cols (overrides action.cols so both stay in sync)
    const { safeTitle } = carouselLayout(action, cols);
    const prev = hoveredAction === "prev" ? `\x1b[7m[ < ]\x1b[27m` : `${ANSI.cyan}[ < ]${ANSI.reset}`;
    const next = hoveredAction === "next" ? `\x1b[7m[ > ]\x1b[27m` : `${ANSI.cyan}[ > ]${ANSI.reset}`;
    return `  ${prev}   \x1b[48;5;236m ${safeTitle} \x1b[0m   ${next}`;
}

function renderQuit(str) {
    const match = str.match(/^(\s*)(.*)$/) ?? ["", "", str];
    return `${match[1]}\x1b[7m${match[2].replace(/\x1b\[0m/g, "\x1b[0m\x1b[7m")}\x1b[27m`;
}

function renderHovered(str, cols) {
    const stripped = stripANSI(str);
    const padded   = str + " ".repeat(Math.max(0, cols - 1 - stripped.length));
    return `\x1b[48;5;237m${padded.replace(/\x1b\[0m/g, "\x1b[0m\x1b[48;5;237m")}\x1b[0m`;
}

/**
 * Renders a list of `{ str, action }` lines into an ANSI buffer,
 * populating `rowMap` for hitbox detection.
 */
export function renderMenuBlock(blockLines, hoveredAction, cols, rowMap, startY, ANSI) {
    let buffer = "", currentY = startY;

    for (const { str, action } of blockLines) {
        if (action) rowMap[currentY] = action;

        if (action?.type === "grid") {
            buffer += renderGrid(action, hoveredAction, cols) + "\r\n";
        } else if (action?.type === "carousel") {
            buffer += renderCarousel(action, hoveredAction, cols, ANSI) + "\r\n";
        } else if (action === "quit" && hoveredAction === "quit") {
            buffer += renderQuit(str) + "\r\n";
        } else if (action && action === hoveredAction) {
            buffer += renderHovered(str, cols) + "\r\n";
        } else {
            buffer += `${str}\r\n`;
        }
        currentY++;
    }
    return { buffer, currentY };
}

// ── Hitbox Detection ──────────────────────────────────────────────────

function carouselHitbox(action, x) {
    if (x >= 3 && x <= 7) return "prev";
    // Use action.cols (stored by the builder) — NO override, so this
    // matches exactly what the renderer computed at draw time.
    const { nextX } = carouselLayout(action);
    return (x >= nextX && x <= nextX + 4) ? "next" : null;
}

/**
 * Returns the action string at terminal coordinates (y, x) using the pre-built rowMap.
 */
export function getMenuActionAt(y, x, rowMap) {
    const action = rowMap[y];
    if (!action) return null;

    if (typeof action === "object") {
        if (action.type === "grid")     return x < action.midX ? action.left : action.right;
        if (action.type === "carousel") return carouselHitbox(action, x);
    }
    if (action === "quit") return (x >= 3 && x <= 8) ? "quit" : null;
    if (action === "BACK_QUIT") {
        if (x >= 3  && x <= 8)  return "back";
        if (x >= 15 && x <= 20) return "quit";
        return null;
    }
    return action;
}
