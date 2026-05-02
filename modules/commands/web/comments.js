/**
 * @module modules/commands/web/comments.js
 * @description Extracts HTML and inline JS comments from the active tab's DOM.
 */

import { ANSI } from "../../formatter.js";

// --- Help Definition ---
export const commentsHelp = {
    name: "comments",
    category: "AUDIT",
    description: "Extract hidden HTML/JS comments from the DOM.",
    usage: "comments [--test]",
    aliases: ["hidden"]
};

// --- Autocomplete Registration ---
export function registerCommentsAutocomplete(addCmd, addAlias) {
    addCmd("comments");
    addAlias("hidden", "comments");
}

// --- Injection Script ---
function extractComments() {
    const comments = [];
    
    // HTML Comments
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT, null, false);
    let node;
    while (node = walker.nextNode()) {
        const text = node.nodeValue.trim();
        if (text.length > 3 && !text.includes('Google Tag Manager') && !text.includes('webpack') && !text.includes('sourceMappingURL')) {
            comments.push({ type: 'HTML', text: text.replace(/\n/g, ' ') });
        }
    }

    // Inline Script Comments (Basic Heuristic)
    const scripts = document.querySelectorAll('script:not([src])');
    for (const script of scripts) {
        const text = script.textContent;
        if (!text) continue;
        const lines = text.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('//') || (line.includes(' // ') && !line.includes('http://') && !line.includes('https://'))) {
                const t = line.substring(line.indexOf('//') + 2).trim();
                if (t.length > 3 && !t.includes('eslint') && !t.includes('sourceMappingURL')) {
                    comments.push({ type: 'JS', text: t });
                }
            } else if (line.startsWith('/*') && line.includes('*/')) {
                const t = line.substring(line.indexOf('/*') + 2, line.indexOf('*/')).trim();
                if (t.length > 3 && !t.includes('eslint')) {
                    comments.push({ type: 'JS', text: t });
                }
            }
        }
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    for (const c of comments) {
        if (!seen.has(c.text)) {
            seen.add(c.text);
            unique.push(c);
        }
    }

    return unique.slice(0, 40);
}

export async function cmdComments(args) {
    const KEYWORDS = ['TODO', 'FIXME', 'API', 'ADMIN', 'PASSWORD', 'SECRET', 'KEY', 'TEST', 'DEBUG', 'STAGING'];

    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Source Code Comments (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}
  ${ANSI.cyan}[HTML]${ANSI.reset} ${ANSI.white}${ANSI.red}${ANSI.bold}TODO${ANSI.reset}${ANSI.white}: Remove staging ${ANSI.red}${ANSI.bold}API${ANSI.reset}${ANSI.white} key before launch${ANSI.reset}
  ${ANSI.yellow}[JS]${ANSI.reset}   ${ANSI.white}Bypassing auth for ${ANSI.red}${ANSI.bold}admin${ANSI.reset}${ANSI.white} panel ${ANSI.red}${ANSI.bold}test${ANSI.reset}${ANSI.white}ing${ANSI.reset}
  ${ANSI.cyan}[HTML]${ANSI.reset} ${ANSI.dim}Main container wrapper for layout${ANSI.reset}
  ${ANSI.yellow}[JS]${ANSI.reset}   ${ANSI.dim}Calculate dynamic pricing based on tier${ANSI.reset}\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) {
        return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;
    }

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractComments
        });

        if (!result) return `${ANSI.red}[ERROR] Could not extract comments.${ANSI.reset}`;

        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Source Code Comments${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(50)}${ANSI.reset}\n`;

        if (result.length === 0) {
            o += `  ${ANSI.dim}No significant inline comments found.${ANSI.reset}\n`;
            return o;
        }

        for (const c of result) {
            let t = c.text;
            if (t.length > 120) t = t.substring(0, 117) + "...";
            
            let isHighlight = false;
            let display = t;
            
            for (const kw of KEYWORDS) {
                const reg = new RegExp(`\\b${kw}\\b`, 'gi');
                if (reg.test(t)) {
                    isHighlight = true;
                    // Replace with bold red, and return back to white (since it's highlighted)
                    display = display.replace(reg, match => `${ANSI.red}${ANSI.bold}${match}${ANSI.reset}${ANSI.white}`);
                }
            }

            const color = isHighlight ? ANSI.white : ANSI.dim;
            const prefix = c.type === 'HTML' ? `${ANSI.cyan}[HTML]${ANSI.reset}` : `${ANSI.yellow}[JS]${ANSI.reset}  `;
            o += `  ${prefix} ${color}${display}${ANSI.reset}\n`;
        }

        return o + "\n";
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
