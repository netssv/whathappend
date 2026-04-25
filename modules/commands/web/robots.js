import {ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  robots
// ===================================================================

export async function cmdRobots(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("robots", "<domain>");

    let o = "";
    o += `> curl https://${domain}/robots.txt\n`;

    const resp = await chrome.runtime.sendMessage({command:"fetch-text",payload:{url:`https://${domain}/robots.txt`}});

    if (resp.error) {
        o += `${ANSI.red}robots.txt: ${resp.error}${ANSI.reset}\n`;
        o += insights([{level:"INFO",text:"No robots.txt or blocked."}]);
    } else {
        const fullLines = resp.data.text.split("\n");
        const lines = fullLines.slice(0, 50);
        
        for (const rawLine of lines) {
            const line = rawLine.trim().toLowerCase();
            if (line.startsWith("disallow")) o += `${ANSI.red}${rawLine}${ANSI.reset}\n`;
            else if (line.startsWith("allow")) o += `${ANSI.green}${rawLine}${ANSI.reset}\n`;
            else if (line.startsWith("user-agent")) o += `${ANSI.cyan}${rawLine}${ANSI.reset}\n`;
            else if (line.startsWith("sitemap")) o += `${ANSI.yellow}${rawLine}${ANSI.reset}\n`;
            else if (line.startsWith("crawl-delay")) o += `${ANSI.magenta}${rawLine}${ANSI.reset}\n`;
            else o += `${ANSI.dim}${rawLine}${ANSI.reset}\n`;
        }
        if (fullLines.length > 50) o += `${ANSI.dim}... (truncated)${ANSI.reset}\n`;

        const ins = [];
        let globalBlocked = false;
        let pathsBlocked = false;
        let currentUserAgent = "";
        let hasSitemap = false;
        let fragmentErrors = 0;
        let fullUaErrors = 0;
        let syntaxErrors = 0;
        let hasCrawlDelay = false;

        for (const raw of fullLines) {
            const line = raw.trim().toLowerCase();
            if (!line || line.startsWith("#")) continue;

            if (line.startsWith("user-agent:")) {
                currentUserAgent = line.substring(11).trim();
                if (currentUserAgent.includes("mozilla/") || currentUserAgent.includes("compatible;")) {
                    fullUaErrors++;
                }
                if (currentUserAgent.includes("^")) {
                    syntaxErrors++;
                }
            } else if (line.startsWith("disallow:")) {
                const path = line.substring(9).trim();
                if (path === "/") {
                    if (currentUserAgent === "*") globalBlocked = true;
                    else pathsBlocked = true;
                } else if (path.length > 0) {
                    pathsBlocked = true;
                    if (path.includes("#")) fragmentErrors++;
                }
            } else if (line.startsWith("allow:")) {
                const path = line.substring(6).trim();
                if (path.includes("#")) fragmentErrors++;
            } else if (line.startsWith("sitemap:")) {
                hasSitemap = true;
            } else if (line.startsWith("crawl-delay:")) {
                hasCrawlDelay = true;
            }
        }

        if (globalBlocked) {
            ins.push({level:"CRIT",text:"Entire site is blocked from crawlers (Disallow: / for *)."});
        } else if (pathsBlocked) {
            ins.push({level:"INFO",text:"Some paths blocked from crawlers."});
        }

        if (hasSitemap) {
            ins.push({level:"PASS",text:"Sitemap reference found."});
        } else {
            ins.push({level:"INFO",text:"No sitemap reference in robots.txt."});
        }

        if (fragmentErrors > 0) {
            ins.push({level:"WARN",text:`Found ${fragmentErrors} rule(s) with '#' fragments. Crawlers ignore URL fragments.`});
        }
        if (fullUaErrors > 0) {
            ins.push({level:"WARN",text:`Found ${fullUaErrors} full User-Agent string(s). Use bot tokens (e.g. 'Googlebot').`});
        }
        if (syntaxErrors > 0) {
            ins.push({level:"WARN",text:`Found ${syntaxErrors} User-Agent(s) using '^'. Not standard in robots.txt.`});
        }
        if (hasCrawlDelay) {
            ins.push({level:"INFO",text:"Crawl-delay present (ignored by Googlebot)."});
        }
        ins.push({ level: "INFO", text: `External Check: https://technicalseo.com/tools/robots-txt/` });

        o += insights(ins);
    }
    return o;
}
