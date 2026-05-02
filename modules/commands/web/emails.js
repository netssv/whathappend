/**
 * @module modules/commands/web/emails.js
 * @description Extracts email addresses from the active tab's DOM.
 */
import { ANSI } from "../../formatter.js";

// --- Injection Script ---
function scrapeEmails() {
    const html = document.documentElement.innerHTML;
    // Ensure domain has a valid TLD (only letters, min 2 chars)
    // Avoid pure IP domains or version numbers like 1.2.3 or 1.x
    const emailRegex = /\b([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})\b/gi;
    let matches = html.match(emailRegex) || [];
    
    // Filter out traps (e.g., false positives ending in image extensions or pure numbers)
    const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.woff', '.ttf'];
    matches = matches.filter(e => {
        const lower = e.toLowerCase();
        if (invalidExtensions.some(ext => lower.endsWith(ext))) return false;
        if (/^\d+@\d+\.\d+$/.test(e)) return false; // purely numeric trap
        // Drop NPM packages or version strings (e.g., package@1.2.3, module@1.x)
        if (/@[0-9]+(\.[0-9x]+)*(-[a-z0-9]+)?$/.test(lower)) return false;
        // Drop weird webpack/URL escaped strings
        if (lower.includes('u002f')) return false;
        return true;
    });

    return [...new Set(matches.map(m => m.toLowerCase()))];
}

export async function cmdEmails(args) {
    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  Email Extractor (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}
  ${ANSI.white}Found 2 email address(es):${ANSI.reset}
    ${ANSI.green}•${ANSI.reset} contact@example.com
    ${ANSI.green}•${ANSI.reset} admin@company.org\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;

    try {
        const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeEmails });
        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  Email Extractor${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(45)}${ANSI.reset}\n`;

        if (!result || result.length === 0) {
            o += `  ${ANSI.yellow}No emails detected on this page.${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.white}Found ${result.length} email address(es):${ANSI.reset}\n`;
            for (const email of result) {
                o += `    ${ANSI.green}•${ANSI.reset} ${email}\n`;
            }
        }
        return o + "\n";
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
