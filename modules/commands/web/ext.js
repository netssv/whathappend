/**
 * @module modules/commands/web/ext.js
 * @description Consolidated external tools wrapper.
 */

import { ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError } from "../../formatter.js";

// ===================================================================
//  EXTERNAL LOOKUPS — Generate clickable links
// ===================================================================

export function cmdExt(args) {
    if (args.length === 0) {
        return {
            __watch: true,
            watcher: {
                onDataDisposable: null,
                start: function(term, doneCallback) {
                    const draw = () => {
                        const target = resolveTargetDomain(undefined, {});
                        const displayTarget = target || "(No active target)";
                        
                        term.write('\x1b[2J\x1b[H');
                        let out = `\n  ${ANSI.bold}${ANSI.cyan}/// EXTERNAL TOOLS ///${ANSI.reset}  ${ANSI.dim}Target: ${ANSI.yellow}${displayTarget}${ANSI.reset}\n\n`;
                        
                        out += `    ${ANSI.bold}[1]${ANSI.reset} 🔒 SSL Labs (Deep TLS Audit)\n`;
                        out += `    ${ANSI.bold}[2]${ANSI.reset} 🛡️ Security Headers (CSP, HSTS)\n`;
                        out += `    ${ANSI.bold}[3]${ANSI.reset} 🚫 Blacklist Check (Spamhaus, MXToolbox)\n`;
                        out += `    ${ANSI.bold}[4]${ANSI.reset} 🌐 Extended WHOIS (ICANN, DomainTools)\n\n`;
                        
                        out += `  ${ANSI.dim}Press 1-4 to select. 'Q' to quit.${ANSI.reset}\n`;
                        term.write(out);
                    };

                    this.onDataDisposable = term.onData(e => {
                        e = e.toLowerCase();
                        if (e === 'q' || e === '\x03' || e === '\r' || e === '\n') {
                            doneCallback();
                            return;
                        }
                        
                        const target = resolveTargetDomain(undefined, {});
                        if (!target && ['1', '2', '3', '4'].includes(e)) {
                            term.write(`\n  ${ANSI.red}[ERROR] No target domain set.${ANSI.reset}\n`);
                            return;
                        }

                        if (e === '1') { term.write('\n' + cmdSSLLabs([target]) + '\n'); doneCallback(); }
                        if (e === '2') { term.write('\n' + cmdSecurityHeaders([target]) + '\n'); doneCallback(); }
                        if (e === '3') { term.write('\n' + cmdBlacklist([target]) + '\n'); doneCallback(); }
                        if (e === '4') { term.write('\n' + cmdWhoisExt([target]) + '\n'); doneCallback(); }
                    });

                    draw();
                },
                stop: function(term) {
                    if (this.onDataDisposable) {
                        this.onDataDisposable.dispose();
                        this.onDataDisposable = null;
                    }
                }
            }
        };
    }

    const sub = args[0].toLowerCase();
    const targetArgs = args.slice(1);

    switch (sub) {
        case "ssl": return cmdSSLLabs(targetArgs);
        case "bl": return cmdBlacklist(targetArgs);
        case "headers": return cmdSecurityHeaders(targetArgs);
        case "whois": return cmdWhoisExt(targetArgs);
        default: return cmdError(`Unknown ext subcommand: ${sub}. Try: ssl, bl, headers, whois.`);
    }
}

// Proxies for backwards-compatibility / alias support

export function cmdBlacklist(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("ext bl", "<ip|domain>");

    let o = `> ext bl ${target}\n\n`;
    o += `  ${ANSI.white}External blacklist checks:${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}MXToolbox${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://mxtoolbox.com/SuperTool.aspx?action=blacklist:${encodeURIComponent(target)}${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}Spamhaus${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://check.spamhaus.org/listed/?searchterm=${encodeURIComponent(target)}${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}AbuseIPDB${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://www.abuseipdb.com/check/${encodeURIComponent(target)}${ANSI.reset}\n`;
    o += `\n${ANSI.dim}Click any link above to open in your browser.${ANSI.reset}`;
    o += insights([
        { level: "INFO", text: `Checking blacklist status for: ${target}` },
        { level: "INFO", text: "If listed, contact the blacklist provider for delisting." },
    ]);
    return o;
}

export function cmdSSLLabs(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("ext ssl", "<domain>");

    if (isIPAddress(target)) {
        return cmdError(` SSL Labs requires a domain, not an IP.`);
    }

    let o = `> ext ssl ${target}\n\n`;
    o += `  ${ANSI.white}SSL Labs Deep Analysis:${ANSI.reset}\n\n`;
    o += `  ${ANSI.blue}https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(target)}&hideResults=on${ANSI.reset}\n`;
    o += `\n${ANSI.dim}Full TLS audit: certificate chain, protocol support, cipher suites,${ANSI.reset}`;
    o += `\n${ANSI.dim}known vulnerabilities (BEAST, POODLE, Heartbleed), and HSTS status.${ANSI.reset}`;
    o += `\n${ANSI.dim}Analysis takes 1-3 minutes on the SSL Labs site.${ANSI.reset}`;
    return o;
}

export function cmdSecurityHeaders(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("ext headers", "<domain>");

    let o = `> ext headers ${target}\n\n`;
    o += `  ${ANSI.white}Security Headers Analysis:${ANSI.reset}\n\n`;
    o += `  ${ANSI.blue}https://securityheaders.com/?q=${encodeURIComponent(target)}&followRedirects=on${ANSI.reset}\n`;
    o += `\n${ANSI.dim}Checks: CSP, X-Frame-Options, X-Content-Type-Options,${ANSI.reset}`;
    o += `\n${ANSI.dim}Strict-Transport-Security, Referrer-Policy, Permissions-Policy.${ANSI.reset}`;
    o += `\n${ANSI.dim}Grades from A+ to F.${ANSI.reset}`;
    return o;
}

export function cmdWhoisExt(args) {
    const info = {};
    const target = resolveTargetDomain(args[0], info);
    if (!target) return cmdUsage("ext whois", "<domain>");

    let o = `> ext whois ${target}\n\n`;
    o += `  ${ANSI.white}Extended WHOIS Lookups:${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}ICANN Lookup${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://lookup.icann.org/en/lookup?name=${encodeURIComponent(target)}${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}who.is${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://who.is/whois/${encodeURIComponent(target)}${ANSI.reset}\n\n`;
    o += `  ${ANSI.cyan}DomainTools${ANSI.reset}\n`;
    o += `  ${ANSI.blue}https://whois.domaintools.com/${encodeURIComponent(target)}${ANSI.reset}\n`;
    o += `\n${ANSI.dim}For a second opinion beyond the built-in RDAP whois command.${ANSI.reset}`;
    return o;
}
