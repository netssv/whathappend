/**
 * @module modules/commands/web/palette.js
 * @description Extracts and lists the most frequently used colors on the active tab.
 */

import { ANSI } from "../../formatter.js";

// --- Help Definition ---
export const paletteHelp = {
    name: "palette",
    category: "WEB",
    description: "Extract the site's primary and secondary color palette.",
    usage: "palette [--test]",
    aliases: ["colors", "theme"]
};

// --- Autocomplete Registration ---
export function registerPaletteAutocomplete(addCmd, addAlias) {
    addCmd("palette");
    addAlias("colors", "palette");
    addAlias("theme", "palette");
}

// --- Injection Script ---
function extractPalette() {
    const colorCounts = new Map();
    
    function toHex(c) {
        if (!c) return null;
        const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return c;
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        if (match[4]) {
            const a = Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0');
            return `#${r}${g}${b}${a}`;
        }
        return `#${r}${g}${b}`;
    }

    function addColor(c) {
        if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'inherit' || c === 'currentColor') return;
        const hex = toHex(c).toLowerCase();
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
    }

    const elements = document.querySelectorAll('body, header, footer, section, nav, div, p, a, button, h1, h2, h3, span');
    const limit = Math.min(elements.length, 3000); // Sample limit
    
    for (let i = 0; i < limit; i++) {
        const style = window.getComputedStyle(elements[i]);
        addColor(style.color);
        addColor(style.backgroundColor);
        if (style.borderStyle !== 'none' && style.borderWidth !== '0px') {
            addColor(style.borderColor);
        }
    }

    const sorted = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);
    
    return {
        primary: sorted.slice(0, 3).map(e => e[0]),
        secondary: sorted.slice(3, 7).map(e => e[0]),
        accent: sorted.slice(7).map(e => e[0])
    };
}

export async function cmdPalette(args) {
    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Color Palette (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}
  ${ANSI.bold}Primary Colors:${ANSI.reset}
  \u001b[38;2;255;255;255m■${ANSI.reset} ${ANSI.white}#ffffff${ANSI.reset} ${ANSI.dim}(Background)${ANSI.reset}
  \u001b[38;2;10;37;64m■${ANSI.reset} ${ANSI.white}#0a2540${ANSI.reset} ${ANSI.dim}(Text)${ANSI.reset}
  \u001b[38;2;99;91;255m■${ANSI.reset} ${ANSI.white}#635bff${ANSI.reset} ${ANSI.dim}(Brand)${ANSI.reset}

  ${ANSI.bold}Secondary & Accents:${ANSI.reset}
  \u001b[38;2;246;249;252m■${ANSI.reset} ${ANSI.white}#f6f9fc${ANSI.reset}
  \u001b[38;2;0;212;255m■${ANSI.reset} ${ANSI.white}#00d4ff${ANSI.reset}\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) {
        return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;
    }

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPalette
        });

        if (!result) return `${ANSI.red}[ERROR] Could not extract color data.${ANSI.reset}`;

        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Extracted Palette${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}\n`;

        if (result.primary.length === 0) {
            o += `  ${ANSI.dim}No significant colors detected.${ANSI.reset}\n`;
            return o;
        }

        const renderGroup = (title, colors) => {
            if (!colors || colors.length === 0) return "";
            let s = `  ${ANSI.bold}${title}:${ANSI.reset}\n`;
            colors.forEach(hex => {
                let r = 0, g = 0, b = 0;
                if (hex.length >= 7) {
                    r = parseInt(hex.substring(1, 3), 16);
                    g = parseInt(hex.substring(3, 5), 16);
                    b = parseInt(hex.substring(5, 7), 16);
                } else if (hex.length === 4) {
                    r = parseInt(hex[1] + hex[1], 16);
                    g = parseInt(hex[2] + hex[2], 16);
                    b = parseInt(hex[3] + hex[3], 16);
                }
                const colorAnsi = `\u001b[38;2;${r};${g};${b}m`;
                s += `  ${colorAnsi}■${ANSI.reset} ${ANSI.white}${hex}${ANSI.reset}\n`;
            });
            return s + "\n";
        };

        o += renderGroup("Primary", result.primary);
        o += renderGroup("Secondary", result.secondary);
        o += renderGroup("Accents", result.accent);

        return o.trimEnd() + "\n";
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
