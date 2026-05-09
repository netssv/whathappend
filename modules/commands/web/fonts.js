/**
 * @module modules/commands/web/fonts.js
 * @description Lists all loaded web fonts on the active tab using document.fonts.
 */

import { ANSI, getSeparator } from "../../formatter.js";

// --- Help Definition ---
export const fontsHelp = {
    name: "fonts",
    category: "WEB",
    description: "List all loaded web fonts on the active tab.",
    usage: "fonts [--links|--download|--test]",
    aliases: ["typography", "type"]
};

// --- Autocomplete Registration ---
export function registerFontsAutocomplete(addCmd, addAlias) {
    addCmd("fonts");
    addAlias("typography", "fonts");
    addAlias("type", "fonts");
}

// --- Injection Script ---
function getLoadedFonts() {
    const fonts = [];
    if (document.fonts) {
        document.fonts.forEach((font) => {
            fonts.push({
                family: font.family,
                style: font.style,
                weight: font.weight,
                status: font.status
            });
        });
    }
    
    // Also try to collect computed fonts for elements
    const uniqueComputed = new Set();
    const elements = document.querySelectorAll('h1, h2, h3, h4, p, span, a, div, button, input');
    for (let i = 0; i < Math.min(elements.length, 100); i++) {
        const ff = window.getComputedStyle(elements[i]).fontFamily;
        if (ff) uniqueComputed.add(ff);
    }

    // Collect downloaded font URLs via Performance API
    const urls = new Set();
    if (performance && performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');
        for (const r of resources) {
            if (r.initiatorType === 'font' || r.name.match(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i)) {
                urls.add(r.name);
            }
        }
    }

    return { 
        loaded: fonts,
        computed: Array.from(uniqueComputed).slice(0, 10),
        urls: Array.from(urls)
    };
}

export async function cmdFonts(args) {
    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Typography (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}
  ${ANSI.green}✓${ANSI.reset} ${ANSI.white}Inter${ANSI.reset} ${ANSI.dim}(400, normal) - loaded${ANSI.reset}
  ${ANSI.green}✓${ANSI.reset} ${ANSI.white}Roboto Mono${ANSI.reset} ${ANSI.dim}(700, normal) - loaded${ANSI.reset}
  ${ANSI.red}✗${ANSI.reset} ${ANSI.white}Comic Sans MS${ANSI.reset} ${ANSI.dim}(400, normal) - error${ANSI.reset}

  ${ANSI.bold}Computed Font Families:${ANSI.reset}
  ${ANSI.dim}• "Inter", sans-serif${ANSI.reset}
  ${ANSI.dim}• "Roboto Mono", monospace${ANSI.reset}\n`;
    }

    const showLinks = args.includes("--links") || args.includes("--download");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) {
        return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;
    }

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getLoadedFonts
        });

        if (!result) return `${ANSI.red}[ERROR] Could not extract font data.${ANSI.reset}`;

        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Typography Analysis${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}\n`;

        if (result.loaded.length === 0) {
            o += `  ${ANSI.dim}No custom fonts loaded via document.fonts API.${ANSI.reset}\n`;
        } else {
            const uniqueLoaded = new Map();
            for (const f of result.loaded) {
                const key = `${f.family}-${f.weight}-${f.style}`;
                if (!uniqueLoaded.has(key)) uniqueLoaded.set(key, f);
            }

            for (const f of uniqueLoaded.values()) {
                const icon = f.status === "loaded" ? `${ANSI.green}✓${ANSI.reset}` : (f.status === "error" ? `${ANSI.red}✗${ANSI.reset}` : `${ANSI.yellow}◌${ANSI.reset}`);
                o += `  ${icon} ${ANSI.white}${f.family.replace(/['"]/g, '')}${ANSI.reset} ${ANSI.dim}(${f.weight}, ${f.style}) - ${f.status}${ANSI.reset}\n`;
            }
        }

        if (result.computed && result.computed.length > 0) {
            o += `\n  ${ANSI.bold}Computed Font Families:${ANSI.reset}\n`;
            for (const c of result.computed) {
                o += `  ${ANSI.dim}• ${c}${ANSI.reset}\n`;
            }
        }

        if (showLinks) {
            o += `\n  ${ANSI.bold}Font Files (Click to Download):${ANSI.reset}\n`;
            if (!result.urls || result.urls.length === 0) {
                o += `  ${ANSI.dim}No font files detected in network requests.${ANSI.reset}\n`;
            } else {
                for (const u of result.urls) {
                    let name = u;
                    try { 
                        const parts = new URL(u).pathname.split('/'); 
                        name = parts[parts.length - 1] || u;
                    } catch {}
                    o += `  ${ANSI.green}↓${ANSI.reset} ${ANSI.white}${name}${ANSI.reset}\n`;
                    o += `    ${ANSI.dim}${u}${ANSI.reset}\n`;
                }
            }
        } else if (result.urls && result.urls.length > 0) {
            o += `\n  ${ANSI.dim}Tip: Use 'fonts --links' to view ${result.urls.length} downloadable font files.${ANSI.reset}\n`;
        }

        return o;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
