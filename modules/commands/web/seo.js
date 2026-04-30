/**
 * @module modules/commands/web/seo.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage from '../../formatter.js'
 * - Exports: cmdSeo
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, getLiveDomNote} from "../../formatter.js";

// ===================================================================
//  seo — Search Engine Optimization baseline check
// ===================================================================

export async function cmdSeo(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("seo", "<domain>");

    let o = `> curl -s https://${domain} | grep -iE '<title>|<meta name="description"|<h[1-6]'\n`;
    let html = "";
    let fetchMethod = "";
    let isLive = false;

    try {
        const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
        if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
            html = domResp.data.html;
            fetchMethod = "Live DOM scan (active tab)";
            isLive = true;
            o += `${ANSI.dim}Scanning Live Rendered DOM for SEO elements...${ANSI.reset}\n\n`;
        }

        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for SEO elements...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        // Parse HTML robustly using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const ins = [];

        // 1. Title
        const title = doc.querySelector('title')?.textContent?.trim() || "";
        o += `${ANSI.white}Title:${ANSI.reset} `;
        if (!title) {
            o += `${ANSI.red}Missing${ANSI.reset}\n`;
            ins.push({level: "CRIT", text: "Page is missing a <title> tag."});
        } else {
            const c = title.length > 60 ? ANSI.yellow : ANSI.green;
            o += `${c}${title}${ANSI.reset} ${ANSI.dim}(${title.length} chars)${ANSI.reset}\n`;
            if (title.length > 60) {
                ins.push({level: "WARN", text: `Title is ${title.length} characters (optimal is < 60 to avoid truncation).`});
            } else {
                ins.push({level: "PASS", text: "Title length is optimal."});
            }
        }

        // 2. Meta Description
        const metaDescEl = doc.querySelector('meta[name="description" i]') || doc.querySelector('meta[property="og:description" i]');
        const desc = metaDescEl ? metaDescEl.getAttribute('content')?.trim() : "";
        o += `${ANSI.white}Description:${ANSI.reset} `;
        if (!desc) {
            o += `${ANSI.red}Missing${ANSI.reset}\n`;
            ins.push({level: "CRIT", text: "Page is missing a meta description."});
        } else {
            const c = desc.length > 160 ? ANSI.yellow : ANSI.green;
            let displayDesc = desc;
            if (displayDesc.length > 80) displayDesc = displayDesc.substring(0, 77) + "...";
            o += `${c}${displayDesc}${ANSI.reset} ${ANSI.dim}(${desc.length} chars)${ANSI.reset}\n`;
            if (desc.length > 160) {
                ins.push({level: "WARN", text: `Description is ${desc.length} characters (optimal is < 160 to avoid truncation).`});
            } else if (desc.length < 50) {
                ins.push({level: "WARN", text: "Description might be too short to be effective."});
            } else {
                ins.push({level: "PASS", text: "Meta description length is optimal."});
            }
        }

        // 3. Headings (H1-H6)
        o += `\n${ANSI.white}Heading Structure:${ANSI.reset}\n`;
        const h1s = Array.from(doc.querySelectorAll('h1'));
        if (h1s.length === 0) {
            o += `  ${ANSI.red}H1: 0 found${ANSI.reset}\n`;
            ins.push({level: "CRIT", text: "Missing H1 tag. This is a major SEO issue."});
        } else if (h1s.length > 1) {
            o += `  ${ANSI.yellow}H1: ${h1s.length} found${ANSI.reset}\n`;
            ins.push({level: "WARN", text: `Multiple (${h1s.length}) H1 tags found. Best practice is exactly one per page.`});
            h1s.slice(0, 3).forEach(h => o += `      ${ANSI.dim}- ${h.textContent.trim().substring(0, 50)}${ANSI.reset}\n`);
            if (h1s.length > 3) o += `      ${ANSI.dim}- ...${ANSI.reset}\n`;
        } else {
            o += `  ${ANSI.green}H1: 1 found${ANSI.reset}\n`;
            o += `      ${ANSI.dim}- ${h1s[0].textContent.trim().substring(0, 60)}${ANSI.reset}\n`;
            ins.push({level: "PASS", text: "Exactly one H1 tag found."});
        }

        for (let i = 2; i <= 6; i++) {
            const count = doc.querySelectorAll(`h${i}`).length;
            if (count > 0) {
                o += `  ${ANSI.cyan}H${i}:${ANSI.reset} ${count}\n`;
            }
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        if (!isLive) {
            ins.push({level: "INFO", text: "Scanned static HTML. If this is an SPA (React/Vue), you may be missing client-rendered SEO tags."});
            ins.push(await getLiveDomNote(domain));
        }

        ins.push({level: "INFO", text: "External Check: https://totheweb.com/tools/seo-browser-simulator/"});
        
        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("PARSE_FAILURE", err.message, "Could not parse HTML for SEO analysis.");
    }
}
