/**
 * @module modules/commands/web/og.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage from '../../formatter.js'
 * - Exports: cmdOg
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, getLiveDomNote} from "../../formatter.js";

// ===================================================================
//  og — Open Graph & Social Preview Cards (Active Tab / Static)
// ===================================================================

export async function cmdOg(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("og", "<domain>");

    let o = `> curl -s https://${domain} | grep -iE 'property="og:|name="twitter:'\n`;
    let html = "";
    let fetchMethod = "";
    let isLive = false;

    try {
        // 1. Try Live DOM if active tab matches domain
        const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
        if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
            html = domResp.data.html;
            fetchMethod = "Live DOM scan (active tab)";
            isLive = true;
            o += `${ANSI.dim}Scanning Live Rendered DOM for Open Graph tags...${ANSI.reset}\n\n`;
        }

        // 2. Fallback to Static HTML source
        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for Open Graph tags...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        // Parse HTML robustly using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const ins = [];

        const tags = {
            ogTitle: doc.querySelector('meta[property="og:title" i]')?.getAttribute('content'),
            ogDesc: doc.querySelector('meta[property="og:description" i]')?.getAttribute('content'),
            ogImage: doc.querySelector('meta[property="og:image" i]')?.getAttribute('content'),
            twCard: doc.querySelector('meta[name="twitter:card" i]')?.getAttribute('content')
        };

        // Output Formatter
        const formatTag = (label, value, isCritical) => {
            let output = `  ${ANSI.white}${label.padEnd(16)}${ANSI.reset}`;
            if (!value) {
                output += `${isCritical ? ANSI.red : ANSI.yellow}Missing${ANSI.reset}\n`;
            } else {
                let displayVal = value;
                if (displayVal.length > 60) displayVal = displayVal.substring(0, 57) + "...";
                output += `${ANSI.cyan}${displayVal}${ANSI.reset}\n`;
            }
            return output;
        };

        o += formatTag("og:title", tags.ogTitle, true);
        o += formatTag("og:description", tags.ogDesc, true);
        o += formatTag("og:image", tags.ogImage, true);
        o += formatTag("twitter:card", tags.twCard, false);

        // Insights Generation
        if (tags.ogTitle && tags.ogDesc && tags.ogImage) {
            ins.push({level: "PASS", text: "Core Open Graph tags are present."});
        } else {
            ins.push({level: "WARN", text: "Missing core Open Graph tags. Social sharing previews will be degraded."});
        }

        if (tags.ogImage && !tags.ogImage.startsWith('http')) {
            ins.push({level: "WARN", text: "og:image should be an absolute URL (including https://)."});
        }

        if (!tags.twCard) {
            ins.push({level: "INFO", text: "Missing twitter:card (typically 'summary_large_image'). Twitter will fallback to OG tags."});
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        if (!isLive) {
            ins.push({level: "INFO", text: "Scanned static HTML. If this is an SPA (React/Vue), you may be missing client-rendered OG tags."});
            ins.push(await getLiveDomNote(domain));
        }

        if (ins.length > 0) o += "\n";
        o += insights(ins);
        o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}https://opengraph.xyz/url/https://${domain}${ANSI.reset}\n`;
        return o;

    } catch (err) {
        return o + formatError("PARSE_FAILURE", err.message, "Could not parse HTML for Open Graph analysis.");
    }
}
