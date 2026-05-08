/**
 * @module modules/commands/web/cms.js
 * @description Fingerprints the active tab's technology stack (CMS, plugins, themes).
 */

import { ANSI } from "../../formatter.js";

// --- Help Definition ---
export const cmsHelp = {
    name: "cms",
    category: "AUDIT",
    description: "Fingerprint the active tab's CMS and plugins.",
    usage: "cms [--test]",
    aliases: ["wordpress", "fingerprint"]
};

// --- Autocomplete Registration ---
export function registerCmsAutocomplete(addCmd, addAlias) {
    addCmd("cms");
    addAlias("wordpress", "cms");
    addAlias("fingerprint", "cms");
}

// --- Injection Script ---
function fingerprintCMS() {
    const data = { generator: null, cms: null, version: null, plugins: [], themes: [] };

    // 1. Meta generator
    const metaGen = document.querySelector('meta[name="generator"]');
    if (metaGen && metaGen.content) {
        data.generator = metaGen.content;
        const genLower = data.generator.toLowerCase();
        if (genLower.includes('wordpress')) {
            data.cms = 'WordPress';
            const m = data.generator.match(/WordPress\s+([\d\.]+)/i);
            if (m) data.version = m[1];
        } else if (genLower.includes('joomla')) {
            data.cms = 'Joomla';
            const m = data.generator.match(/Joomla!\s+([\d\.]+)/i);
            if (m) data.version = m[1];
        } else if (genLower.includes('drupal')) {
            data.cms = 'Drupal';
            const m = data.generator.match(/Drupal\s+([\d\.]+)/i);
            if (m) data.version = m[1];
        } else {
            data.cms = data.generator; // fallback
        }
    }

    // 2. Scan paths
    const elements = document.querySelectorAll('link[href], script[src]');
    const paths = Array.from(elements).map(e => e.href || e.src);
    const pluginSet = new Set(), themeSet = new Set();

    for (const p of paths) {
        if (!p) continue;
        // WordPress
        if (p.includes('wp-content/plugins/')) {
            data.cms = data.cms || 'WordPress';
            const m = p.match(/wp-content\/plugins\/([^\/]+).*?(?:ver=|v=)([\d\.]+)/);
            if (m) pluginSet.add(`${m[1]}|${m[2]}`);
            else {
                const m2 = p.match(/wp-content\/plugins\/([^\/]+)/);
                if (m2) pluginSet.add(`${m2[1]}|`);
            }
        }
        if (p.includes('wp-content/themes/')) {
            data.cms = data.cms || 'WordPress';
            const m = p.match(/wp-content\/themes\/([^\/]+).*?(?:ver=|v=)([\d\.]+)/);
            if (m) themeSet.add(`${m[1]}|${m[2]}`);
            else {
                const m2 = p.match(/wp-content\/themes\/([^\/]+)/);
                if (m2) themeSet.add(`${m2[1]}|`);
            }
        }
        if (p.includes('wp-includes/')) {
            data.cms = data.cms || 'WordPress';
            if (!data.version) {
                const m = p.match(/wp-includes\/.*?(?:ver=|v=)([\d\.]+)/);
                if (m && m[1].length > 2 && m[1].includes('.')) data.version = m[1];
            }
        }
        // Drupal
        if (p.includes('sites/all/modules/') || p.includes('core/modules/')) data.cms = data.cms || 'Drupal';
        // Shopify
        if (p.includes('cdn.shopify.com')) data.cms = data.cms || 'Shopify';
    }

    data.plugins = Array.from(pluginSet);
    data.themes = Array.from(themeSet);
    return data;
}

export async function cmdCms(args) {
    const OUTDATED = {
        'WordPress': ['4.', '5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '6.0', '6.1', '6.2'],
        'Joomla': ['3.', '4.0', '4.1', '4.2'],
        'Drupal': ['7.', '8.', '9.0', '9.1', '9.2', '9.3']
    };

    if (args[0] === "--test") {
        return `\n${ANSI.cyan}${ANSI.bold}  CMS Fingerprint (Test Mock)${ANSI.reset}
  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}
  ${ANSI.bold}Platform:${ANSI.reset}  WordPress
  ${ANSI.bold}Version:${ANSI.reset}   ${ANSI.red}4.1.2${ANSI.reset} ${ANSI.red}[OUTDATED/VULNERABLE]${ANSI.reset}
  ${ANSI.bold}Themes:${ANSI.reset}    avada ${ANSI.dim}(v7.1.1)${ANSI.reset}
  ${ANSI.bold}Plugins:${ANSI.reset}
    ${ANSI.dim}•${ANSI.reset} revslider ${ANSI.yellow}[Missing Version]${ANSI.reset}
    ${ANSI.dim}•${ANSI.reset} woocommerce ${ANSI.dim}(v5.0.0)${ANSI.reset}
    ${ANSI.dim}•${ANSI.reset} contact-form-7 ${ANSI.dim}(v5.3.2)${ANSI.reset}\n`;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith("http")) return `${ANSI.red}[ERROR] Must be used on an HTTP/HTTPS page.${ANSI.reset}`;

    try {
        const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: fingerprintCMS });
        if (!result) return `${ANSI.red}[ERROR] Could not extract CMS data.${ANSI.reset}`;

        let host = "";
        try { host = new URL(tab.url).hostname; } catch { host = "Page"; }

        let o = `\n${ANSI.cyan}${ANSI.bold}  CMS Fingerprint${ANSI.reset} ${ANSI.dim}${host}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}${"━".repeat(40)}${ANSI.reset}\n`;

        if (!result.cms) {
            o += `  ${ANSI.dim}No identifiable CMS detected.${ANSI.reset}\n`;
            return o;
        }

        o += `  ${ANSI.bold}Platform:${ANSI.reset}  ${ANSI.white}${result.cms}${ANSI.reset}\n`;
        
        if (result.version) {
            let isOutdated = false;
            if (OUTDATED[result.cms]) {
                for (const badVer of OUTDATED[result.cms]) {
                    if (result.version.startsWith(badVer)) isOutdated = true;
                }
            }
            if (isOutdated) {
                o += `  ${ANSI.bold}Version:${ANSI.reset}   ${ANSI.red}${result.version}${ANSI.reset} ${ANSI.red}[OUTDATED/VULNERABLE]${ANSI.reset}\n`;
            } else {
                o += `  ${ANSI.bold}Version:${ANSI.reset}   ${ANSI.green}${result.version}${ANSI.reset}\n`;
            }
        } else {
            o += `  ${ANSI.bold}Version:${ANSI.reset}   ${ANSI.yellow}[Hidden / Missing]${ANSI.reset}\n`;
        }

        if (result.themes.length > 0) {
            const tMap = result.themes.map(t => {
                const [name, ver] = t.split('|');
                return `${name}${ver ? ` ${ANSI.dim}(v${ver})${ANSI.reset}` : ` ${ANSI.yellow}[Missing Version]${ANSI.reset}`}`;
            }).join(', ');
            o += `  ${ANSI.bold}Themes:${ANSI.reset}    ${tMap}\n`;
        }

        if (result.plugins.length > 0) {
            o += `  ${ANSI.bold}Plugins:${ANSI.reset}\n`;
            for (const p of result.plugins) {
                const [name, ver] = p.split('|');
                const vStr = ver ? `${ANSI.dim}(v${ver})${ANSI.reset}` : `${ANSI.yellow}[Missing Version]${ANSI.reset}`;
                o += `    ${ANSI.dim}•${ANSI.reset} ${ANSI.white}${name}${ANSI.reset} ${vStr}\n`;
            }
        }

        return o + "\n";
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
