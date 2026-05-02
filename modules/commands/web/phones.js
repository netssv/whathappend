/**
 * @module modules/commands/web/phones.js
 * @description Extracts phone numbers from the active tab's DOM.
 */
import { ANSI } from "../../formatter.js";

// --- Injection Script ---
function scrapePhones() {
    const html = document.documentElement.innerHTML;
    const results = new Set();

    // 1. Extract tel: URIs (most reliable)
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    telLinks.forEach(link => {
        const num = link.getAttribute('href').replace('tel:', '').trim();
        // Just extract digits and plus
        const clean = num.replace(/[^\d+]/g, '');
        if (clean.length >= 7) results.add(num);
    });

    // 2. Fallback regex to search visible text
    // Requires some formatting (space, dash, dot, parens, or +) to avoid capturing raw IDs
    // Matches: +1 (555) 123-4567, 555-1234, +44 20 7123 1234, (800) 555-1234, 2278-3470
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g;

    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = textWalker.nextNode())) {
        const text = node.nodeValue;
        if (!text || text.trim().length < 7) continue;
        
        let match;
        while ((match = phoneRegex.exec(text)) !== null) {
            const raw = match[0].trim();
            const digits = raw.replace(/\D/g, '');
            
            // Text match must contain at least one non-digit (formatting) to avoid pure IDs
            if (!/[-+().\s]/.test(raw)) continue;
            
            if (digits.length >= 7 && digits.length <= 15) {
                if (digits.length === 13 && (digits.startsWith('978') || digits.startsWith('979'))) continue;
                results.add(raw);
            }
        }
    }

    return Array.from(results);
}

export async function cmdPhones(args) {
    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Phone Extractor (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}
  ${ANSI.white}Found 2 phone number(s):${ANSI.reset}
    ${ANSI.green}•${ANSI.reset} +1 (555) 123-4567
    ${ANSI.green}•${ANSI.reset} +44 20 7123 1234\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;

    try {
        const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapePhones });
        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Phone Extractor${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}\n`;

        if (!result || result.length === 0) {
            o += `  ${ANSI.yellow}No phone numbers detected on this page.${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.white}Found ${result.length} phone number(s):${ANSI.reset}\n`;
            for (const phone of result) {
                o += `    ${ANSI.green}•${ANSI.reset} ${phone}\n`;
            }
        }
        return o + "\n";
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
