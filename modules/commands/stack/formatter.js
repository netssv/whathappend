/**
 * @module modules/commands/stack/formatter.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, insights from '../../formatter.js'
 * - Exports: formatStackOutput
 * - Layer: Command Layer (Stack) - Tech stack identification.
 */

import { ANSI, insights } from "../../formatter.js";

export function formatStackOutput({ domain, foundCMS, foundFrameworks, foundServers, headers, headersLower, fetchMethod }) {
    const sepLen = Math.min(50, 36);
    const sep = ANSI.dim + "━".repeat(sepLen) + ANSI.reset;
    let o = `> stack ${domain}\n`;
    o += `${ANSI.dim}Detecting technology stack...${ANSI.reset}\n\n`;

    // CMS
    o += `${ANSI.white}${ANSI.bold}  CMS${ANSI.reset}\n  ${sep}\n`;
    if (foundCMS.length > 0) {
        for (const sig of foundCMS) o += `  ${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${sig.name}${ANSI.reset}\n`;
    } else o += `  ${ANSI.dim}None detected${ANSI.reset}\n`;

    // Frameworks
    o += `\n${ANSI.white}${ANSI.bold}  FRAMEWORKS${ANSI.reset}\n  ${sep}\n`;
    if (foundFrameworks.length > 0) {
        for (const sig of foundFrameworks) o += `  ${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${sig.name}${ANSI.reset}\n`;
    } else o += `  ${ANSI.dim}None detected${ANSI.reset}\n`;

    // Server / CDN
    o += `\n${ANSI.white}${ANSI.bold}  SERVER / CDN${ANSI.reset}\n  ${sep}\n`;
    if (foundServers.length > 0) {
        for (const sig of foundServers) o += `  ${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${sig.name}${ANSI.reset}\n`;
    } else {
        if (headersLower["server"]) o += `  ${ANSI.dim}Server: ${headersLower["server"]}${ANSI.reset}\n`;
        else o += `  ${ANSI.dim}No server header exposed${ANSI.reset}\n`;
    }

    const extras = [];
    if (headersLower["x-powered-by"]) extras.push(`X-Powered-By: ${headers["x-powered-by"]}`);
    if (headersLower["x-generator"]) extras.push(`Generator: ${headers["x-generator"]}`);
    if (headersLower["x-shopify-stage"]) extras.push("Shopify staging detected");
    if (headersLower["x-drupal-cache"]) extras.push("Drupal cache layer active");

    if (extras.length > 0) {
        o += `\n${ANSI.white}${ANSI.bold}  HINTS${ANSI.reset}\n  ${sep}\n`;
        for (const ex of extras) o += `  ${ANSI.dim}${ex}${ANSI.reset}\n`;
    }

    const total = foundCMS.length + foundFrameworks.length + foundServers.length;
    o += `\n${ANSI.dim}Executed: ${fetchMethod} + HTTP HEAD (${total} technologies detected)${ANSI.reset}`;

    const ins = [];
    if (foundCMS.length > 0) {
        const cms = foundCMS[0];
        if (cms.id === "wordpress") ins.push({ level: "INFO", text: "WordPress detected. Check /wp-admin and plugin versions." });
        if (cms.id === "shopify") ins.push({ level: "PASS", text: "Shopify — managed hosting, SSL included." });
        if (cms.id === "wix") ins.push({ level: "INFO", text: "Wix — limited server-side control." });
    }
    if (foundFrameworks.some(f => f.id === "react" || f.id === "vue" || f.id === "nextjs")) {
        ins.push({ level: "INFO", text: "SPA/SSR framework detected — check client-side rendering SEO." });
    }
    if (foundFrameworks.some(f => f.id === "jquery")) {
        ins.push({ level: "INFO", text: "jQuery detected. Consider migration if version < 3.x." });
    }
    if (foundServers.some(s => s.id === "cloudflare")) {
        ins.push({ level: "INFO", text: "Behind Cloudflare — real server IP hidden." });
    }
    if (headersLower["x-powered-by"]) {
        ins.push({ level: "WARN", text: `X-Powered-By header exposed: ${headers["x-powered-by"]}` });
    }
    if (total === 0) {
        ins.push({ level: "INFO", text: "No technologies detected. Site may use custom stack or block fingerprinting." });
    }

    if (fetchMethod.startsWith("Static HTML")) {
        ins.push({level:"INFO",text:"Tip: Run this command while the site is open in the active tab for deeper JS/DOM analysis."});
    }

    ins.push({ level: "INFO", text: `Test Stack: https://builtwith.com/${encodeURIComponent(domain)}` });

    o += insights(ins);
    return o;
}
