import { ANSI } from "../../formatter.js";
import { CMD_ALIASES } from "../../data/aliases.js";
import { getTermCols } from "../../state.js";

// ===================================================================
//  Detailed help — cmd?
// ===================================================================

export function formatHelp(options = {}) {
    const { name, syntax, descLines = [], aliases = null, examples = [] } = options;
    const cols = getTermCols();
    const sepLen = Math.min(cols - 4, 50);
    const sep = ANSI.dim + "━".repeat(Math.min(50, Math.max(10, sepLen))) + ANSI.reset;

    let out = `\n  ${ANSI.cyan}${ANSI.bold}${name}${ANSI.reset} ${ANSI.dim}${syntax}${ANSI.reset}\n`;
    out += `  ${sep}\n`;
    for (const line of descLines) {
        out += `    ${line}\n`;
    }
    if (aliases) {
        out += `    ${ANSI.dim}Aliases: ${aliases}${ANSI.reset}\n`;
    }
    out += `  ${sep}\n`;
    for (const ex of examples) {
        out += `    ${ANSI.green}${ex.cmd}${ANSI.reset}`;
        if (ex.desc) {
            out += `  ${ANSI.dim}${ex.desc}${ANSI.reset}`;
        }
        out += `\n`;
    }
    return out + "\n";
}

export function sh(cmd, type, desc) {
    return formatHelp({
        name: cmd, syntax: "[domain]",
        descLines: [`Shortcut: dig <domain> ${type} (short)`, desc],
        aliases: null,
        examples: [{ cmd: `${cmd} example.com`, desc: "" }, { cmd: `${cmd}`, desc: "(active tab)" }]
    });
}

export function cmdDetailedHelp(cmd, suggestCommand) {
    const resolved = CMD_ALIASES[cmd] || cmd;
    const h = {
        dig:()=>formatHelp({name:"dig", syntax:"[domain] [type] [+short]", descLines:["Query the DNS system for raw records.", "Think of DNS as the phonebook of the internet.", "Types: A, AAAA, MX, TXT, NS, CNAME, SOA."], aliases:"dns, record", examples:[{cmd: "dig google.com MX"}, {cmd: "dig google.com txt +short", desc: "raw only"}, {cmd: "mx", desc: "(short + insights)"}, {cmd: "google.com", desc: "(auto dig short)"}]}),
        host:()=>formatHelp({name:"host", syntax:"[domain]", descLines:["Quickly find the IP address (A/AAAA) and", "Mail server (MX) for a given domain."], aliases:null, examples:[{cmd: "host google.com"}]}),
        nslookup:()=>formatHelp({name:"nslookup", syntax:"[domain]", descLines:["Identify the name servers managing a domain."], aliases:"lookup", examples:[{cmd: "nslookup google.com"}]}),
        a:()=>sh("a","A","Find the IPv4 address (where the website is hosted)."), aaaa:()=>sh("aaaa","AAAA","Find the IPv6 address."),
        mx:()=>sh("mx","MX","Mail servers (who receives emails for this domain?)."), txt:()=>sh("txt","TXT","Text records (used for SPF/security verification)."),
        ns:()=>sh("ns","NS","Nameservers (who manages the DNS settings?)."), cname:()=>sh("cname","CNAME","Domain aliases (e.g. www points to root)."),
        soa:()=>formatHelp({name:"soa", syntax:"[domain]", descLines:["Start of Authority (SOA) record.", "Contains core information about the DNS zone:", " - The primary name server.", " - The email of the domain administrator.", " - Timers for refreshing and caching (TTL).", "Useful for debugging DNS propagation issues."], aliases:null, examples:[{cmd: "soa google.com"}, {cmd: "soa", desc: "(active tab)"}]}),
        email:()=>formatHelp({name:"email", syntax:"[domain]", descLines:["Audit email deliverability & security.", "Checks if the domain can receive mail (MX),", "and verifies anti-spoofing records (SPF, DMARC,", "DKIM) to ensure emails don't go to spam."], aliases:"mail", examples:[{cmd: "email google.com"}]}),
        web:()=>formatHelp({name:"web", syntax:"[domain]", descLines:["General website health check.", "Combines IP resolution (A), server response (HTTP),", "and certificate validation (SSL) into one audit."], aliases:"audit", examples:[{cmd: "web google.com"}]}),
        sec:()=>formatHelp({name:"sec", syntax:"[domain]", descLines:["Frontend security scorecard.", "Checks if the server forces HTTPS (HSTS) and", "protects against XSS/Clickjacking using", "modern HTTP security headers."], aliases:"security, scan", examples:[{cmd: "sec google.com"}]}),
        ttl:()=>formatHelp({name:"ttl", syntax:"[domain]", descLines:["Check DNS Time-To-Live (TTL).", "Tells you how long DNS records are cached.", "Useful to know how long a migration will take."], aliases:null, examples:[{cmd: "ttl google.com"}]}),
        spf:()=>formatHelp({name:"spf", syntax:"[domain]", descLines:["Sender Policy Framework audit.", "Checks which servers are authorized to send", "emails on behalf of this domain."], aliases:null, examples:[{cmd: "spf google.com"}]}),
        dmarc:()=>formatHelp({name:"dmarc", syntax:"[domain]", descLines:["DMARC enforcement check.", "Tells email receivers (like Gmail) what to do", "if an email fails SPF/DKIM (e.g. reject it)."], aliases:null, examples:[{cmd: "dmarc google.com"}]}),
        dkim:()=>formatHelp({name:"dkim", syntax:"[domain] [selector]", descLines:["DKIM signature scan.", "Dynamically infers selectors from MX and SPF", "records. Follow CNAME chains up to 3 levels.", "Optionally specify a manual selector to test."], aliases:null, examples:[{cmd: "dkim google.com"}, {cmd: "dkim example.com myselector", desc: "manual"}]}),
        robots:()=>formatHelp({name:"robots", syntax:"[domain]", descLines:["Parse robots.txt to see SEO directives.", "Detects blocked paths, missing sitemaps,", "and syntax errors (like fragments)."], aliases:"sitemap", examples:[{cmd: "robots google.com"}, {cmd: "sitemap", desc: "(active tab)"}]}),
        pixels:()=>formatHelp({name:"pixels", syntax:"[domain]", descLines:["Scan website for marketing/tracking scripts.", "Detects Meta Pixel, Google Analytics, LinkedIn,", "TikTok, and 20+ other tracking platforms."], aliases:"tracking, trackers, ads", examples:[{cmd: "pixels shopify.com"}]}),
        stack:()=>formatHelp({name:"stack", syntax:"[domain]", descLines:["Detect website technology stack.", "Finds CMS (WordPress, Shopify), Frameworks", "(React, Vue), and Servers (Nginx, Cloudflare)."], aliases:"tech, cms, wappalyzer, techstack", examples:[{cmd: "stack google.com"}, {cmd: "tech", desc: "(active tab)"}]}),
        curl:()=>formatHelp({name:"curl", syntax:"[url]", descLines:["Fetch raw HTTP headers from the server.", "Useful to see the exact server response code", "(200, 404, 500) and security configurations."], aliases:"http, headers", examples:[{cmd: "curl google.com"}]}),
        openssl:()=>formatHelp({name:"openssl", syntax:"[domain]", descLines:["Inspect the SSL/TLS Certificate.", "Verifies who issued the cert, when it expires,", "and if the HTTPS connection is secure."], aliases:"ssl, cert, tls", examples:[{cmd: "openssl google.com"}]}),
        whois:()=>formatHelp({name:"whois", syntax:"[domain]", descLines:["Domain Registration Data (RDAP/WHOIS).", "Shows who owns the domain, where it was", "registered, and when it expires."], aliases:"domain", examples:[{cmd: "whois google.com"}]}),
        registrar:()=>formatHelp({name:"registrar", syntax:"[domain]", descLines:["Domain lifecycle summary.", "Shows registrar name, creation date, expiry,", "and days remaining until renewal is due."], aliases:"reg, lifecycle", examples:[{cmd: "registrar google.com"}, {cmd: "registrar", desc: "(active tab)"}]}),
        hosting:()=>formatHelp({name:"hosting", syntax:"[domain|ip]", descLines:["Identify the web hosting provider.", "Resolves A record → IP → RDAP to find", "who is hosting the website (e.g. AWS, Cloudflare)."], aliases:"provider, webhost, hoster", examples:[{cmd: "hosting google.com"}, {cmd: "hosting 8.8.8.8", desc: "(IP direct)"}]}),
        ping:()=>formatHelp({name:"ping", syntax:"[domain]", descLines:["Test server responsiveness (latency).", "Sends 4 HTTPS requests to see how fast", "the server responds in milliseconds."], aliases:"latency", examples:[{cmd: "ping google.com"}]}),
        trace:()=>formatHelp({name:"trace", syntax:"[url]", descLines:["Follow URL redirect chains.", "Great for debugging infinite redirect loops,", "or seeing where a shortlink goes."], aliases:"redirect, follow, traceroute", examples:[{cmd: "trace google.com"}]}),
        "rev-dns":()=>formatHelp({name:"rev-dns", syntax:"[ip]", descLines:["Reverse DNS lookup (PTR record).", "Given an IP address, this finds the domain", "name and hosting provider behind it."], aliases:"rdns, ptr, reverse-dns", examples:[{cmd: "rev-dns 8.8.8.8"}]}),
        "port-scan":()=>formatHelp({name:"port-scan", syntax:"[domain] [ports]", descLines:["Scan for open network ports.", "Finds if services like SSH (22), FTP (21),", "or Databases (3306) are exposed to the public."], aliases:"ports, nmap, portscan", examples:[{cmd: "port-scan google.com"}, {cmd: "port-scan 10.0.0.1 80,443,8080"}]}),
        "ftp-check":()=>formatHelp({name:"ftp-check", syntax:"[domain]", descLines:["Check if an insecure FTP server is running.", "Attempts to grab the FTP banner to identify", "the server software version."], aliases:"ftp", examples:[{cmd: "ftp-check example.com"}]}),
        "export":()=>formatHelp({name:"export", syntax:"[json|csv]", descLines:["Save your terminal session.", "Exports all commands and insights into a", "file you can share with your team."], aliases:"dump, report, save", examples:[{cmd: "export json"}, {cmd: "export csv"}]}),
        blacklist:()=>formatHelp({name:"blacklist", syntax:"[ip|domain]", descLines:["Check if the IP/Domain is flagged as spam.", "Generates links to MXToolbox and Spamhaus", "to verify sender reputation."], aliases:"bl, rbl, dnsbl", examples:[{cmd: "blacklist 8.8.8.8"}, {cmd: "blacklist example.com"}]}),
        ssllabs:()=>formatHelp({name:"ssllabs", syntax:"[domain]", descLines:["Qualys SSL Labs deep analysis.", "Creates a link to scan for vulnerabilities", "and grade the TLS cipher configuration."], aliases:"ssltest, ssl-labs", examples:[{cmd: "ssllabs google.com"}]}),
        securityheaders:()=>formatHelp({name:"securityheaders", syntax:"[domain]", descLines:["SecurityHeaders.com deep analysis.", "Creates a link to grade the HTTP headers", "from A+ down to F."], aliases:"sheaders, sec-headers", examples:[{cmd: "securityheaders google.com"}]}),
        "whois-ext":()=>formatHelp({name:"whois-ext", syntax:"[domain]", descLines:["External WHOIS databases.", "Provides links to ICANN and DomainTools", "for a second opinion on domain ownership."], aliases:"icann, whoisext", examples:[{cmd: "whois-ext example.com"}]}),
        target:()=>formatHelp({name:"target", syntax:"[domain|auto]", descLines:["Set or show the active target domain."], aliases:null, examples:[{cmd: "target example.com", desc: "set target"}, {cmd: "target", desc: "show current target"}, {cmd: "target auto", desc: "reset to active tab"}]}),
        clear:()=>formatHelp({name:"clear", syntax:"", descLines:["Clear terminal.", "Also: Ctrl+L"], aliases:"cls, reset", examples:[{cmd: "clear"}]}),
        help:()=>formatHelp({name:"help", syntax:"", descLines:["Command list.", "Add ? for details: email?"], aliases:"ls, commands, man, ?", examples:[{cmd: "help"}]}),
    };
    if (h[resolved]) return h[resolved]();
    const suggestion = suggestCommand(cmd);
    if (suggestion) return `\n  ${ANSI.dim}No help for '${cmd}'.${ANSI.reset} ${ANSI.yellow}Did you mean '${suggestion}'?${ANSI.reset}\n  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
    return `\n  ${ANSI.dim}No help for '${cmd}'. Type ${ANSI.white}help${ANSI.dim} for commands.${ANSI.reset}\n`;
}
