/**
 * @module modules/commands/web/socials.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError from '../../formatter.js'
 * - Exports: cmdSocials
 * - Layer: Command Layer (Web) - HTTP, SSL, and Web fingerprinting tools.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage, cmdError} from "../../formatter.js";

const SOCIAL_NETWORKS = [
    { id: "facebook", name: "Facebook", regex: /https?:\/\/(www\.)?facebook\.com\/([a-zA-Z0-9_.-]+)/gi },
    { id: "twitter", name: "X (Twitter)", regex: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_.-]+)/gi },
    { id: "instagram", name: "Instagram", regex: /https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)/gi },
    { id: "linkedin", name: "LinkedIn", regex: /https?:\/\/(www\.)?linkedin\.com\/(company|in)\/([a-zA-Z0-9_.-]+)/gi },
    { id: "youtube", name: "YouTube", regex: /https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)?([a-zA-Z0-9_.-]+)/gi },
    { id: "tiktok", name: "TikTok", regex: /https?:\/\/(www\.)?tiktok\.com\/@([a-zA-Z0-9_.-]+)/gi },
    { id: "github", name: "GitHub", regex: /https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_.-]+)/gi },
    { id: "pinterest", name: "Pinterest", regex: /https?:\/\/(www\.)?pinterest\.com\/([a-zA-Z0-9_.-]+)/gi }
];

// Exclude common false positives (like share links)
const EXCLUDES = ["sharer", "share", "intent", "tweet", "post", "plugins", "dialog"];

export async function cmdSocials(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("socials", "<domain>");

    let o = `> curl -s https://${domain} | grep -oE 'https?://(twitter|facebook|instagram)...'\n`;
    let html = "";
    let fetchMethod = "";

    try {
        const domResp = await chrome.runtime.sendMessage({ command: "get-page-html" });
        if (domResp?.success && domResp.data?.html && domResp.data.url.includes(domain)) {
            html = domResp.data.html;
            fetchMethod = "Live DOM scan (active tab)";
            o += `${ANSI.dim}Scanning Live Rendered DOM for social profiles...${ANSI.reset}\n\n`;
        }

        if (!html) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url: `https://${domain}` } });
            if (!resp || resp.error) {
                return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch the page.", "Verify the domain is accessible.");
            }
            html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            fetchMethod = "Static HTML source scan";
            o += `${ANSI.dim}Scanning Static HTML source for social profiles...${ANSI.reset}\n\n`;
        }

        if (!html || html.length < 50) return o + `${ANSI.yellow}[WARN]${ANSI.reset} Page returned empty or minimal HTML.\n`;

        const foundProfiles = {};

        for (const net of SOCIAL_NETWORKS) {
            const matches = [...html.matchAll(net.regex)];
            for (const m of matches) {
                let fullUrl = m[0];
                // Remove trailing quotes, spaces, or HTML chars that might have been matched
                fullUrl = fullUrl.replace(/["'><]/g, "").replace(/\\/g, "");
                
                if (EXCLUDES.some(ex => fullUrl.toLowerCase().includes(ex))) continue;
                if (fullUrl.endsWith(".js") || fullUrl.endsWith(".css")) continue;

                if (!foundProfiles[net.id]) foundProfiles[net.id] = { name: net.name, handles: new Set() };
                foundProfiles[net.id].handles.add(fullUrl);
            }
        }

        const networksFound = Object.values(foundProfiles);

        if (networksFound.length > 0) {
            o += `${ANSI.white}${ANSI.bold}  SOCIAL PRESENCE DETECTED (${networksFound.length})${ANSI.reset}\n`;
            for (const net of networksFound) {
                const links = Array.from(net.handles).slice(0, 3); // Max 3 examples per network
                o += `  ${ANSI.cyan}${net.name}${ANSI.reset}\n`;
                for (const link of links) {
                    o += `    ${ANSI.dim}↳${ANSI.reset} ${ANSI.white}${link}${ANSI.reset}\n`;
                }
            }
        } else {
            o += `${ANSI.dim}  No standard social media profiles detected in ${fetchMethod.toLowerCase()}.${ANSI.reset}\n`;
        }

        o += `\n${ANSI.dim}Executed: ${fetchMethod}${ANSI.reset}`;

        const isStatic = fetchMethod === "Static HTML source scan";
        const isSPA = isStatic && (html.includes('id="__next"') || html.includes('id="root"') || html.includes('__react') || html.includes('nuxt-') || html.includes('v-app'));
        const isBlocked = isStatic && (html.includes('cloudflare-nginx') || html.includes('enable cookies') || html.includes('security check') || html.includes('just a moment'));

        const ins = [];
        if (networksFound.length === 0) {
            if (isSPA) ins.push({level:"WARN",text:"Site is a Single Page App. Social links are rendered via JavaScript (try running this on the active tab)."});
            else if (isBlocked) ins.push({level:"WARN",text:"Fetch blocked by a Web Application Firewall (Cloudflare, etc)."});
            else {
                ins.push({level:"INFO",text:"No social links found in the homepage HTML."});
                ins.push({level:"INFO",text:"They might be loaded via JavaScript or placed on a Contact page."});
            }
        } else {
            ins.push({level:"PASS",text:`Found presence on ${networksFound.length} social platform(s).`});
            if (foundProfiles["github"]) {
                ins.push({level:"WARN",text:"GitHub links often point to open-source libraries used by the site, not their official profile."});
            }
        }

        if (isStatic) {
            ins.push({level:"INFO",text:"Tip: Run this command while the site is open in the active tab for deeper JS/DOM analysis."});
        }
        
        ins.push({ level: "INFO", text: `External Check: https://builtwith.com/${encodeURIComponent(domain)}` });

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("FETCH_FAILURE", err.message, "The page may block external requests.");
    }
}
