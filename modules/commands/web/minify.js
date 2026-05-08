/**
 * @module modules/commands/web/minify.js
 * @description Asset minification audit.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, getLiveDomNote} from "../../formatter.js";

export async function cmdMinify(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("minify", "<domain>");

    let o = `> curl -s https://${domain} | grep -oE '<script src=|<link rel="stylesheet"'\n`;
    let html = "";
    let fetchMethod = "";
    let isLive = false;

    try {
        const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
        if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
            html = domResp.data.html;
            fetchMethod = "Live DOM scan (active tab)";
            isLive = true;
            o += `${ANSI.dim}Scanning Live Rendered DOM for unminified assets...${ANSI.reset}\n\n`;
        }

        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for unminified assets...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const assets = Array.from(doc.querySelectorAll("script[src], link[rel='stylesheet']"));
        const ins = [];
        const unminified = [];

        assets.forEach(asset => {
            const src = asset.getAttribute("src") || asset.getAttribute("href");
            if (!src) return;

            // Simple heuristic: if it doesn't contain .min. and is not a data URI
            if (!src.includes(".min.") && !src.startsWith("data:") && !src.includes("chrome-extension:")) {
                unminified.push(src);
            }
        });

        if (unminified.length === 0) {
            o += `${ANSI.green}All assets seem properly minified.${ANSI.reset}\n`;
            ins.push({ level: "PASS", text: "No unminified scripts or stylesheets detected." });
        } else {
            o += `${ANSI.yellow}Found ${unminified.length} potentially unminified assets:${ANSI.reset}\n`;
            unminified.slice(0, 5).forEach(src => {
                const filename = src.split('/').pop().split('?')[0] || src;
                o += `  ${ANSI.dim}▪${ANSI.reset} ${filename}\n`;
            });
            if (unminified.length > 5) {
                o += `  ${ANSI.dim}... and ${unminified.length - 5} more.${ANSI.reset}\n`;
            }
            ins.push({ level: "WARN", text: `${unminified.length} assets are missing '.min' in their filename. This may impact load performance.` });
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        if (!isLive) {
            ins.push(await getLiveDomNote(domain));
        }

        if (ins.length > 0) o += "\n";
        o += insights(ins);
        o += `\n${ANSI.dim}External:${ANSI.reset} ${ANSI.blue}https://pagespeed.web.dev/analysis?url=https://${domain}${ANSI.reset}\n`;
        return o;

    } catch (err) {
        return o + formatError("PARSE_FAILURE", err.message, "Failed to run minification audit.");
    }
}
