import { ANSI, isIPAddress } from "../../formatter.js";
import { ContextManager } from "../../context.js";
import { getTermCols } from "../../state.js";
import { HELP_SECTIONS } from "../../data/help-data.js";

export function renderTextHelp(query) {
    const cols = getTermCols();
    const currentTarget = ContextManager.getDomain();
    const targetIsIP = currentTarget ? isIPAddress(currentTarget) : false;
    const domainOnly = ["email", "spf", "dmarc", "dkim", "openssl", "whois",
                        "audit", "pixels", "socials", "stack", "robots", "web", "sec"];

    let titles = [];
    if (query === "audit" || query === "audits") titles = ["AUDIT TOOLS"];
    else if (query === "dns") titles = ["DNS"];
    else if (query === "short" || query === "shortcuts") titles = ["DNS SHORTCUTS"];
    else if (query === "email" || query === "mail") titles = ["EMAIL"];
    else if (query === "web") titles = ["WEB TOOLS"];
    else if (query === "net" || query === "network") titles = ["NETWORK"];
    else if (query === "ext" || query === "external") titles = ["EXTERNAL"];
    else if (query === "util" || query === "utils") titles = ["UTIL"];
    else if (query === "all") titles = HELP_SECTIONS.map(s => s.title);
    else return `\n  ${ANSI.red}Unknown category: ${query}${ANSI.reset}\n  ${ANSI.dim}Type 'help' for categories.${ANSI.reset}\n`;

    let o = targetIsIP ? `\n${ANSI.yellow}  [WARNING] IP target — domain-only commands dimmed${ANSI.reset}\n` : "";

    for (const section of HELP_SECTIONS.filter(s => titles.includes(s.title))) {
        const sub = section.subtitle ? ` ${ANSI.dim}${section.subtitle}${ANSI.reset}` : "";
        const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, cols - 4))) + ANSI.reset;
        o += `\n${ANSI.white}${ANSI.bold}  ${section.title}${ANSI.reset}${sub}\n  ${sep}\n`;

        for (const [name, desc, aliases] of section.cmds) {
            const base = name.split(" ")[0].toLowerCase();
            const dim = targetIsIP && domainOnly.includes(base);
            const nc = dim ? ANSI.dim : ANSI.cyan;
            const tag = dim ? ` ${ANSI.yellow}[domain]${ANSI.reset}` : "";
            const pad = Math.max(1, 16 - name.length);
            o += `  ${nc}${name}${ANSI.reset}${" ".repeat(pad)}${ANSI.dim}${desc}${ANSI.reset}${tag}\n`;
            if (aliases) o += `  ${" ".repeat(16)}${ANSI.gray}↪ ${aliases}${ANSI.reset}\n`;
        }
    }
    o += `\n${ANSI.dim}  Add ${ANSI.white}?${ANSI.dim} for details: ${ANSI.white}email?${ANSI.dim}  ${ANSI.white}mx?${ANSI.reset}\n`;
    return o;
}
