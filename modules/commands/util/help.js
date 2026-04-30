/**
 * @module modules/commands/util/help.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI, isIPAddress from '../../formatter.js'
 *     - ContextManager from '../../context.js'
 *     - getTermCols from '../../state.js'
 * - Exports: HELP_SECTIONS, cmdHelp
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI, isIPAddress } from "../../formatter.js";
import { ContextManager } from "../../context.js";
import { getTermCols } from "../../state.js";
import { HELP_SECTIONS } from "../../data/help-data.js";

// ===================================================================
//  help — Responsive layout (adapts to terminal width)
// ===================================================================



export function cmdHelp(args = []) {
    const cols = getTermCols();

    // IP-aware dimming: domain-only commands are dimmed when target is an IP
    const currentTarget = ContextManager.getDomain();
    const targetIsIP = currentTarget ? isIPAddress(currentTarget) : false;
    const domainOnlyCmds = ["email", "spf", "dmarc", "dkim", "openssl", "whois", "audit", "pixels", "socials", "stack", "robots", "web", "sec"];

    let o = "";

    if (targetIsIP) {
        o += `\n${ANSI.yellow}  ⚠ IP target detected (${currentTarget}) — domain-only commands dimmed${ANSI.reset}\n`;
    }

    if (args.length === 0) {
        // Exploratory Menu
        const sepLen = Math.min(cols - 4, 42);
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

        o += `\n${ANSI.white}${ANSI.bold}  EXPLORE COMMANDS${ANSI.reset}\n  ${sep}\n`;
        o += `  ${ANSI.dim}Type ${ANSI.white}help <category>${ANSI.dim} to view commands:${ANSI.reset}\n\n`;

        const categories = [
            ["audit", "High-level checks (email, web, sec)"],
            ["dns", "DNS resolution (dig, host, nslookup...)"],
            ["short", "DNS quick shortcuts (a, mx, txt...)"],
            ["email", "Email infrastructure (spf, dkim, dmarc)"],
            ["web", "Web auditing tools (whois, curl...)"],
            ["net", "Network & topology (ping, isup...)"],
            ["ext", "External third-party tools (opens link)"],
            ["util", "Terminal utilities (config, tabs...)"],
            ["all", "Show all commands"]
        ];

        for (const [cat, desc] of categories) {
            const label = `[${cat}]`;
            o += `  ${ANSI.cyan}${label.padEnd(9)}${ANSI.reset} ${ANSI.dim}${desc}${ANSI.reset}\n`;
        }

        o += `\n${ANSI.dim}  💡 Tip: Add ${ANSI.white}?${ANSI.dim} to any command for examples (e.g. ${ANSI.white}mx?${ANSI.dim})${ANSI.reset}\n`;
        o += `${ANSI.dim}  📚 Full Docs: ${ANSI.cyan}\x1b[4mhttps://github.com/netssv/whathappend/blob/main/COMMANDS.md\x1b[0m\n`;
        return o;
    }

    // Specific category requested
    const query = args[0].toLowerCase();
    
    // Mapping keywords to sections
    let targetSectionTitles = [];
    if (query === "audit" || query === "audits") targetSectionTitles = ["AUDITS"];
    else if (query === "dns") targetSectionTitles = ["DNS"];
    else if (query === "short" || query === "shortcuts") targetSectionTitles = ["DNS SHORTCUTS"];
    else if (query === "email" || query === "mail") targetSectionTitles = ["EMAIL"];
    else if (query === "web") targetSectionTitles = ["WEB"];
    else if (query === "net" || query === "network") targetSectionTitles = ["NETWORK"];
    else if (query === "ext" || query === "external") targetSectionTitles = ["EXTERNAL"];
    else if (query === "util" || query === "utils" || query === "utility") targetSectionTitles = ["UTIL"];
    else if (query === "all") targetSectionTitles = HELP_SECTIONS.map(s => s.title);
    else {
        return `\n  ${ANSI.red}Unknown category: ${query}${ANSI.reset}\n  ${ANSI.dim}Type 'help' to see available categories.${ANSI.reset}\n`;
    }

    const filteredSections = HELP_SECTIONS.filter(s => targetSectionTitles.includes(s.title));

    for (const section of filteredSections) {
        const sub = section.subtitle ? ` ${ANSI.dim}${section.subtitle}${ANSI.reset}` : "";
        const sepLen = Math.min(cols - 4, 42);
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

        o += `\n${ANSI.white}${ANSI.bold}  ${section.title}${ANSI.reset}${sub}\n  ${sep}\n`;

        for (const [name, desc, aliases] of section.cmds) {
            // Check if this command is domain-only and target is IP
            const cmdBase = name.split(" ")[0].toLowerCase();
            const isDimmed = targetIsIP && domainOnlyCmds.includes(cmdBase);
            const nameColor = isDimmed ? ANSI.dim : ANSI.cyan;
            const descColor = ANSI.dim;
            const dimTag = isDimmed ? ` ${ANSI.yellow}[domain]${ANSI.reset}` : "";

            if (cols < 50) {
                // Ultra narrow (mobile/squeezed side panel)
                o += `  ${nameColor}${name}${ANSI.reset}${dimTag}\n`;
                o += `    ${descColor}${desc}${ANSI.reset}\n`;
                if (aliases) {
                    o += `    ${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
                }
            } else {
                // Standard mode (clean 2-column layout with alias below)
                const pad = Math.max(1, 16 - name.length);
                o += `  ${nameColor}${name}${ANSI.reset}${" ".repeat(pad)}${descColor}${desc}${ANSI.reset}${dimTag}\n`;
                if (aliases) {
                    o += `  ${" ".repeat(16)}${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
                }
            }
        }
    }

    o += `\n${ANSI.dim}  Add ${ANSI.white}?${ANSI.dim} for details: ${ANSI.white}email?${ANSI.dim}  ${ANSI.white}mx?${ANSI.reset}\n`;
    o += `${ANSI.dim}  Omit domain = active tab | Ctrl+C cancel${ANSI.reset}\n`;
    return o;
}
