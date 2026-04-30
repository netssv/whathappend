/**
 * @module modules/commands/util/errors.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ANSI from '../../formatter.js'
 *     - getTermCols from '../../state.js'
 * - Exports: cmdErrors
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

import { ANSI } from "../../formatter.js";
import { getTermCols } from "../../state.js";

// ===================================================================
//  errors — Error & Insight Reference
// ===================================================================

export function cmdErrors() {
    const cols = getTermCols();
    const sepLen = Math.min(cols - 4, 50);
    const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

    let o = `\n${ANSI.white}${ANSI.bold}  INSIGHT LEVELS${ANSI.reset}\n  ${sep}\n`;
    o += `  ${ANSI.green}[PASS]${ANSI.reset}  Check passed. No action needed.\n`;
    o += `  ${ANSI.cyan}[INFO]${ANSI.reset}  Informational. Context for the analyst.\n`;
    o += `  ${ANSI.yellow}[WARN]${ANSI.reset}  Potential issue. Review recommended.\n`;
    o += `  ${ANSI.red}[CRIT]${ANSI.reset}  Critical. Immediate action required.\n`;

    o += `\n${ANSI.white}${ANSI.bold}  ERROR CODES${ANSI.reset}\n  ${sep}\n`;
    o += `  ${ANSI.red}CONNECTION_TIMEOUT${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Server did not respond within the timeout window.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Check the domain. Try ${ANSI.white}ssllabs${ANSI.dim} or ${ANSI.white}ping${ANSI.dim}.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}CONNECTION_REFUSED${ANSI.reset}\n`;
    o += `  ${ANSI.dim}HTTPS on port 443 is not responding.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Server may be down or not running HTTPS.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}DNS_FAILURE${ANSI.reset}\n`;
    o += `  ${ANSI.dim}DNS resolver returned no records.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Verify the domain exists. Try ${ANSI.white}dig${ANSI.dim} with different types.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}HTTP_FAILURE${ANSI.reset}\n`;
    o += `  ${ANSI.dim}HTTP request failed (network error or CORS).${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Check your connection. Try ${ANSI.white}curl${ANSI.dim} again.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}SSL_FAILURE${ANSI.reset}\n`;
    o += `  ${ANSI.dim}SSL inspection could not complete.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Try ${ANSI.white}ssllabs${ANSI.dim} for external scan.${ANSI.reset}\n\n`;

    o += `  ${ANSI.yellow}RESTRICTED${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Chrome's sandbox blocks this operation.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Affects: port-scan, ftp-check (raw sockets).${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Use the external triage link provided.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}NO_RESPONSE${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Background service worker did not respond.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Fix: Reload the extension (chrome://extensions).${ANSI.reset}\n`;

    o += `\n${ANSI.white}${ANSI.bold}  HTTP STATUS CODES${ANSI.reset}\n  ${sep}\n`;

    o += `  ${ANSI.red}403${ANSI.reset} ${ANSI.white}Forbidden${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Permission issue or IP block. Check folder permissions${ANSI.reset}\n`;
    o += `  ${ANSI.dim}(755/644), .htaccess rules, or ModSecurity/WAF logs.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}500${ANSI.reset} ${ANSI.white}Internal Server Error${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Server-side crash. Check PHP error_log, application${ANSI.reset}\n`;
    o += `  ${ANSI.dim}logs, or framework stack trace.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}502${ANSI.reset} ${ANSI.white}Bad Gateway${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Reverse proxy can't reach backend. Check if PHP-FPM,${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Node, or Gunicorn process is running.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}503${ANSI.reset} ${ANSI.white}Service Unavailable${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Server overload or maintenance mode. Check CPU/RAM${ANSI.reset}\n`;
    o += `  ${ANSI.dim}limits and worker processes.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}520${ANSI.reset} ${ANSI.white}Unknown Error (Cloudflare)${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Origin returned something unexpected. Usually a PHP${ANSI.reset}\n`;
    o += `  ${ANSI.dim}crash or resource limit. Check origin server logs.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}521${ANSI.reset} ${ANSI.white}Web Server Down (Cloudflare)${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Origin refused connection. Check if web server process${ANSI.reset}\n`;
    o += `  ${ANSI.dim}(Nginx/Apache/LiteSpeed) is running on the origin.${ANSI.reset}\n\n`;

    o += `  ${ANSI.red}550${ANSI.reset} ${ANSI.white}Mailbox Unavailable (SMTP)${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Recipient server rejected mail. Causes: blacklisted IP,${ANSI.reset}\n`;
    o += `  ${ANSI.dim}SPF/DMARC failure, or non-existent mailbox.${ANSI.reset}\n`;
    o += `  ${ANSI.dim}Triage: ${ANSI.white}blacklist${ANSI.dim} + ${ANSI.white}spf${ANSI.dim} + ${ANSI.white}dmarc${ANSI.reset}\n`;

    o += `\n${ANSI.white}${ANSI.bold}  COMMON INSIGHTS${ANSI.reset}\n  ${sep}\n`;

    const items = [
        ["HSTS", "Strict-Transport-Security header.", "Forces HTTPS. Prevents SSL stripping attacks."],
        ["CSP", "Content-Security-Policy header.", "Blocks XSS by restricting script sources."],
        ["X-Frame", "X-Frame-Options header.", "Prevents clickjacking by blocking iframe embedding."],
        ["X-CTO", "X-Content-Type-Options header.", "Prevents MIME-type sniffing attacks."],
        ["SPF", "Sender Policy Framework.", "Lists authorized mail servers for the domain."],
        ["DMARC", "Domain-based Message Auth.", "Tells receivers how to handle SPF/DKIM failures."],
        ["DKIM", "DomainKeys Identified Mail.", "Cryptographic signature on outgoing emails."],
        ["Cloudflare", "CDN detected via IP range.", "Real server IP is hidden behind the proxy."],
        ["Let's Encrypt", "Free CA (auto-renewable).", "90-day certs. Auto-renewal recommended."],
        ["EXPIRED", "SSL certificate has expired.", "Browsers will show security warnings to visitors."],
    ];

    for (const [term_, desc, detail] of items) {
        o += `  ${ANSI.cyan}${term_}${ANSI.reset} ${ANSI.dim}— ${desc}${ANSI.reset}\n`;
        o += `  ${ANSI.dim}  ${detail}${ANSI.reset}\n`;
    }

    o += `\n${ANSI.dim}  Use ${ANSI.white}help${ANSI.dim} for commands or ${ANSI.white}email?${ANSI.dim} for command details.${ANSI.reset}\n`;
    return o;
}
