import { ANSI, insights, resolveTargetDomain, cmdUsage, formatError } from "../../formatter.js";

// ===================================================================
//  links — Mixed Content Scanner (Active Tab & Static)
// ===================================================================

export async function cmdLinks(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("links", "<domain>");

    let o = `> curl -s https://${domain} | grep -ioE '(src|href)="http://[^"]+"'\n`;

    try {
        let links = [];
        let url = `https://${domain}`;
        let isLive = false;

        // 1. Try Live DOM if active tab matches domain
        try {
            const resp = await chrome.runtime.sendMessage({ command: "get-links" });
            if (resp?.success && resp.data?.url.includes(domain)) {
                links = resp.data.links;
                url = resp.data.url;
                isLive = true;
                o += `${ANSI.dim}Scanning Live Rendered DOM...${ANSI.reset}\n\n`;
            }
        } catch (_) {}

        // 2. Fallback to Static HTML source
        if (!isLive) {
            const resp = await chrome.runtime.sendMessage({ command: "fetch-text", payload: { url } });
            if (!resp || resp.error) {
                return o + formatError("FETCH_FAILED", resp?.error || "Could not fetch page.", "Check if domain is accessible.", `https://builtwith.com/${encodeURIComponent(domain)}`);
            }
            
            const html = typeof resp.data?.text === "string" ? resp.data.text : (typeof resp.data === "string" ? resp.data : "");
            o += `${ANSI.dim}Scanning Static HTML source...${ANSI.reset}\n\n`;
            
            // Extract src and href
            const regex = /(?:src|href)=["']([^"']+)["']/gi;
            let match;
            const seen = new Set();
            while ((match = regex.exec(html)) !== null) {
                const link = match[1];
                if (link.startsWith("http") && !seen.has(link)) {
                    seen.add(link);
                    links.push({ tag: "static", url: link });
                }
            }
        }

        const isSecure = url.startsWith("https://");
        const insecure = links.filter(l => l.url.startsWith("http://"));
        
        o += `${ANSI.dim}Scanned ${links.length} absolute resources on ${new URL(url).hostname}${ANSI.reset}\n\n`;

        if (isSecure) {
            if (insecure.length > 0) {
                insecure.forEach(l => {
                    o += `  ${ANSI.red}✗${ANSI.reset} [${l.tag.padEnd(6)}] ${ANSI.red}${l.url}${ANSI.reset}\n`;
                });
            } else {
                o += `  ${ANSI.green}✓${ANSI.reset} No mixed content detected.\n`;
            }
        } else {
            o += `  ${ANSI.yellow}⚠${ANSI.reset} Page is not using HTTPS. Mixed content rules do not apply.\n`;
        }

        const ins = [];
        if (isSecure && insecure.length > 0) {
            ins.push({ level: "WARN", text: `${insecure.length} insecure resources detected (Mixed Content).` });
            ins.push({ level: "INFO", text: "Browsers may block these scripts or show a 'Not Secure' warning." });
        } else if (isSecure) {
            ins.push({ level: "PASS", text: "All resources loaded securely over HTTPS." });
        }
        ins.push({ level: "INFO", text: `External Check: https://www.jitbit.com/sslcheck/?url=https://${domain}` });
        return o + insights(ins);
    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message);
    }
}
