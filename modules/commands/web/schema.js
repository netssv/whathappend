/**
 * @module modules/commands/web/schema.js
 * @description Structured Data (Schema.org) Scanner.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, getLiveDomNote} from "../../formatter.js";

export async function cmdSchema(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("schema", "<domain>");

    let o = `> curl -s https://${domain} | grep -i 'application/ld+json'\n`;
    let html = "";
    let fetchMethod = "";
    let isLive = false;

    try {
        const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
        if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
            html = domResp.data.html;
            fetchMethod = "Live DOM scan (active tab)";
            isLive = true;
            o += `${ANSI.dim}Scanning Live Rendered DOM for structured data...${ANSI.reset}\n\n`;
        }

        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for structured data...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const schemas = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        const ins = [];

        if (schemas.length === 0) {
            o += `  ${ANSI.yellow}No JSON-LD structured data found.${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "No JSON-LD detected. Structured data is vital for rich search results (Rich Snippets)." });
        } else {
            o += `${ANSI.white}Found ${schemas.length} JSON-LD block(s):${ANSI.reset}\n`;
            
            schemas.forEach((s, i) => {
                try {
                    const json = JSON.parse(s.textContent.trim());
                    // Schema can be an array of objects or a single object
                    if (Array.isArray(json)) {
                        o += `  ${ANSI.dim}${i+1}.${ANSI.reset} ${ANSI.cyan}Array [${json.length} items]${ANSI.reset}\n`;
                        json.forEach((item, j) => {
                            const type = item["@type"] || item["@context"] || "Unknown";
                            o += `      ${ANSI.dim}↳${ANSI.reset} ${ANSI.cyan}${type}${ANSI.reset}\n`;
                        });
                    } else {
                        const type = json["@type"] || json["@context"] || "Unknown";
                        o += `  ${ANSI.dim}${i+1}.${ANSI.reset} ${ANSI.cyan}${type}${ANSI.reset}\n`;
                    }
                } catch (e) {
                    o += `  ${ANSI.dim}${i+1}.${ANSI.reset} ${ANSI.red}Invalid JSON content${ANSI.reset}\n`;
                }
            });
            
            ins.push({ level: "PASS", text: "JSON-LD structured data is present." });
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        if (!isLive) {
            ins.push(await getLiveDomNote(domain));
        }

        if (ins.length > 0) o += "\n";
        o += insights(ins);
        o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}https://search.google.com/test/rich-results?url=https://${domain}${ANSI.reset}\n`;
        return o;

    } catch (err) {
        return o + formatError("PARSE_FAILURE", err.message, "Failed to run schema audit.");
    }
}
