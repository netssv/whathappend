/**
 * @module modules/commands/web/waf.js
 * @description WAF detection and Fingerprinting.
 */

import {ANSI, insights, resolveTargetDomain, formatError, cmdUsage} from "../../formatter.js";

export async function cmdWaf(args) {
    const info = {};
    const url = resolveTargetDomain(args[0], info);
    if (!url) return cmdUsage("waf", "<url>");

    let o = `> curl -I https://${url} | grep -iE '(cf-ray|x-amz-cf-id|akamai|sucuri|imperva)'\n`;

    try {
        const resp = await chrome.runtime.sendMessage({ command: "http-headers", payload: { url } });
        if (!resp || resp.error) {
            return o + formatError("HTTP_FAILURE", resp?.error || "Could not fetch headers.", "Check the domain and your connection.");
        }

        const headers = resp.data.headers;
        const ins = [];
        let detected = false;

        // Cloudflare
        if (headers["cf-ray"] || headers["server"]?.toLowerCase().includes("cloudflare")) {
            o += `${ANSI.cyan}Cloudflare${ANSI.reset} detected via ${ANSI.dim}cf-ray / server${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Cloudflare is active. Provides DDoS protection and WAF capabilities." });
            detected = true;
        }

        // Akamai
        if (headers["x-akamai-transformed"] || headers["akamai-origin-hop"] || headers["server"]?.toLowerCase().includes("akamai")) {
            o += `${ANSI.cyan}Akamai${ANSI.reset} detected via ${ANSI.dim}akamai-* headers${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Akamai Intelligent Edge detected. Advanced WAF and Bot Manager usually active." });
            detected = true;
        }

        // AWS CloudFront
        if (headers["x-amz-cf-id"] || headers["x-amz-cf-pop"] || headers["via"]?.toLowerCase().includes("cloudfront")) {
            o += `${ANSI.cyan}Amazon CloudFront${ANSI.reset} detected via ${ANSI.dim}x-amz-cf-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "AWS CloudFront detected. Ensure AWS WAF is configured for this distribution." });
            detected = true;
        }

        // Sucuri
        if (headers["x-sucuri-id"] || headers["x-sucuri-cache"] || headers["server"]?.toLowerCase().includes("sucuri")) {
            o += `${ANSI.cyan}Sucuri WAF${ANSI.reset} detected via ${ANSI.dim}x-sucuri-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Sucuri Website Firewall is protecting this site." });
            detected = true;
        }

        // Imperva / Incapsula
        if (headers["x-cdn"]?.toLowerCase().includes("imperva") || headers["incap-ses"]) {
            o += `${ANSI.cyan}Imperva${ANSI.reset} detected via ${ANSI.dim}incap-ses${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Imperva (Incapsula) WAF detected." });
            detected = true;
        }

        // Fastly
        if (headers["x-fastly-request-id"] || headers["via"]?.toLowerCase().includes("fastly")) {
            o += `${ANSI.cyan}Fastly${ANSI.reset} detected via ${ANSI.dim}x-fastly-request-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Fastly Edge detected. Often used with Signal Sciences WAF." });
            detected = true;
        }

        // AWS Application Load Balancer / API Gateway
        if (headers["x-amzn-trace-id"] || headers["x-amzn-requestid"] || headers["server"]?.toLowerCase().includes("awselb")) {
            o += `${ANSI.cyan}AWS Edge/ALB${ANSI.reset} detected via ${ANSI.dim}AWS headers${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "AWS infrastructure detected. AWS WAF might be attached." });
            detected = true;
        }

        // Azure Front Door / Application Gateway
        if (headers["x-azure-ref"] || headers["x-ms-routing-name"] || headers["server"]?.toLowerCase().includes("azure")) {
            o += `${ANSI.cyan}Azure Front Door${ANSI.reset} detected via ${ANSI.dim}x-azure-ref${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Azure Edge Network detected. Azure WAF is likely active." });
            detected = true;
        }

        // Vercel Edge
        if (headers["x-vercel-id"] || headers["server"]?.toLowerCase() === "vercel") {
            o += `${ANSI.cyan}Vercel Edge${ANSI.reset} detected via ${ANSI.dim}x-vercel-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Vercel Edge Network detected. Includes built-in DDoS mitigation." });
            detected = true;
        }

        // Netlify Edge
        if (headers["x-nf-request-id"] || headers["server"]?.toLowerCase() === "netlify") {
            o += `${ANSI.cyan}Netlify Edge${ANSI.reset} detected via ${ANSI.dim}x-nf-request-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "Netlify Edge network detected. Standard DDoS protection is active." });
            detected = true;
        }

        // GitHub Custom Infrastructure
        if (headers["x-github-request-id"]) {
            o += `${ANSI.cyan}GitHub Infrastructure${ANSI.reset} detected via ${ANSI.dim}x-github-request-id${ANSI.reset}\n`;
            ins.push({ level: "INFO", text: "GitHub proprietary edge infrastructure detected." });
            detected = true;
        }

        if (!detected) {
            o += `${ANSI.dim}No common WAF signatures found in HTTP headers.${ANSI.reset}\n`;
            ins.push({ level: "WARN", text: "No WAF detected. The site may be vulnerable to brute force or Layer 7 attacks if not protected." });
        } else {
            ins.push({ level: "PASS", text: "Web Application Firewall detected. Site has an active security perimeter." });
        }

        o += insights(ins);
        return o;

    } catch (err) {
        return o + formatError("EXECUTION_FAILED", err.message, "Failed to analyze WAF signatures.");
    }
}
