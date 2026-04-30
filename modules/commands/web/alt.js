/**
 * @module modules/commands/web/alt.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage from '../../formatter.js'
 * - Exports: cmdAlt
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

// ===================================================================
//  alt — Image Accessibility Scanner (Active Tab / Static)
// ===================================================================

export async function cmdAlt(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("alt", "<domain>");

    let o = `> curl -s https://${domain} | grep -ioE '<img[^>]+>'\n`;
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
            o += `${ANSI.dim}Scanning Live Rendered DOM for image accessibility...${ANSI.reset}\n\n`;
        }

        // 2. Fallback to Static HTML source
        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for image accessibility...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        // Parse HTML robustly using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const imgs = Array.from(doc.querySelectorAll('img'));
        const ins = [];

        o += `${ANSI.white}Total Images Found:${ANSI.reset} ${imgs.length}\n`;

        if (imgs.length === 0) {
            ins.push({level: "INFO", text: "No <img> tags found on this page."});
        } else {
            let missingAlt = [];
            let emptyAlt = 0;
            let validAlt = 0;

            imgs.forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || 'unknown-source';
                
                if (!img.hasAttribute('alt')) {
                    missingAlt.push(src);
                } else {
                    const altText = img.getAttribute('alt').trim();
                    if (altText === "") {
                        emptyAlt++;
                    } else {
                        validAlt++;
                    }
                }
            });

            o += `\n${ANSI.white}Accessibility Breakdown:${ANSI.reset}\n`;
            o += `  ${ANSI.green}Valid alt text:${ANSI.reset}     ${validAlt}\n`;
            o += `  ${ANSI.cyan}Empty alt (decor):${ANSI.reset}  ${emptyAlt} ${ANSI.dim}(Usually fine for decorative images)${ANSI.reset}\n`;
            
            if (missingAlt.length > 0) {
                o += `  ${ANSI.red}Missing alt attribute:${ANSI.reset} ${missingAlt.length}\n\n`;
                o += `${ANSI.dim}Images missing alt attributes:${ANSI.reset}\n`;
                
                // Show up to 5 missing alt images
                const limit = Math.min(missingAlt.length, 5);
                for (let i = 0; i < limit; i++) {
                    let displaySrc = missingAlt[i];
                    if (displaySrc.length > 50) displaySrc = displaySrc.substring(0, 47) + "...";
                    o += `  ${ANSI.red}✗${ANSI.reset} ${ANSI.dim}${displaySrc}${ANSI.reset}\n`;
                }
                
                if (missingAlt.length > limit) {
                    o += `  ${ANSI.dim}...and ${missingAlt.length - limit} more.${ANSI.reset}\n`;
                }

                ins.push({level: "CRIT", text: `${missingAlt.length} images are completely missing the 'alt' attribute.`});
                ins.push({level: "INFO", text: "Screen readers will read the file name instead, which is bad for UX and SEO."});
            } else {
                o += `  ${ANSI.green}Missing alt attribute:${ANSI.reset} 0\n`;
                ins.push({level: "PASS", text: "All images have an 'alt' attribute defined."});
            }
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        if (!isLive) {
            ins.push({level: "INFO", text: "Scanned static HTML. If this is an SPA (React/Vue), images might load dynamically."});
            ins.push({level: "INFO", text: "To scan the final DOM, navigate to the site in your browser and run: alt here"});
        }

        ins.push({level: "INFO", text: `External Check: https://wave.webaim.org/report#/${domain}`});
        
        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("PARSE_FAILURE", err.message, "Could not parse HTML for Accessibility analysis.");
    }
}
