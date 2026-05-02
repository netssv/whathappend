/**
 * @module modules/commands/dns/map.js
 * @description Enhanced ASCII visual map of the DNS resolution journey.
 */

import { ANSI, resolveTargetDomain, toRegisteredDomain } from "../../formatter.js";

const CDN_PATTERNS = [
    [/cloudfront\.net/i, "Amazon CloudFront"], [/cloudflare/i, "Cloudflare"],
    [/akamai/i, "Akamai"], [/fastly/i, "Fastly"], [/azurefd|azure-dns/i, "Azure"],
    [/googleapis|google/i, "Google Cloud"], [/edgekey/i, "Akamai Edge"],
    [/awsdns/i, "Amazon Route 53"], [/registrar-servers/i, "Namecheap"],
    [/domaincontrol/i, "GoDaddy"], [/dnsimple/i, "DNSimple"],
];
const TLD_OPS = {
    ".com":"Verisign",".net":"Verisign",".org":"PIR",".io":"NIC.io",
    ".dev":"Google",".uk":"Nominet",".sv":"SVNet",".mx":"NIC México",
    ".br":"NIC.br",".co":"NeuStar",".app":"Google",".jp":"JPRS",
};

function detect(str) {
    if (!str) return null;
    for (const [re, n] of CDN_PATTERNS) { if (re.test(str)) return n; }
    return null;
}

async function query(domain, type) {
    const r = await chrome.runtime.sendMessage({ command: "dns", payload: { domain, type } });
    if (!r?.data?.Answer) return [];
    return r.data.Answer.filter(Boolean);
}

export async function cmdMap(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return `${ANSI.red}[ERROR] No domain specified.${ANSI.reset}`;

    try {
        const root = toRegisteredDomain(domain);
        const parts = root.split(".");
        const tld = "." + parts[parts.length - 1];
        const isCCTLD = parts.length >= 2 && parts[parts.length - 2].length <= 3;
        const fullTLD = isCCTLD ? "." + parts.slice(-2).join(".") : tld;
        const tldOp = TLD_OPS[fullTLD] || TLD_OPS[tld] || null;

        // Fetch NS
        let nsAll = (await query(root, "NS")).map(r => r.data).filter(Boolean);
        if (!nsAll.length) {
            const soa = await query(root, "SOA");
            if (soa.length) nsAll = [soa[0].data.split(" ")[0]];
        }
        const nsProv = detect(nsAll[0]);

        // Fetch A + CNAME
        let aAll = await query(domain, "A");
        let aIPs = aAll.map(r => r.data).filter(Boolean);
        let aTTL = aAll[0]?.TTL || null;
        const cnameAll = (await query(domain, "CNAME")).map(r => r.data).filter(Boolean);
        let cname = cnameAll.length ? cnameAll[0].replace(/\.$/, "") : null;

        if (cname && !aIPs.length) {
            const resolved = await query(cname, "A");
            aIPs = resolved.map(r => r.data).filter(Boolean);
            aTTL = resolved[0]?.TTL || null;
        }

        const ip = aIPs[0] || null;
        const cdn = detect(cname);
        const ok = !!ip;

        // Shortcuts
        const D = ANSI.dim, R = ANSI.reset, B = ANSI.bold, W = ANSI.white;

        let o = `\n${ANSI.cyan}${B}  DNS Resolution Journey for ${domain}${R}\n`;
        o += `  ${D}${"━".repeat(45)}${R}\n\n`;

        // ── STEP 1 ──
        o += `  ${B}STEP 1${R} ${D}·${R} ${ANSI.blue}💻 Browser Cache${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        o += `  ${D}Your browser checks its local DNS${R}\n`;
        o += `  ${D}cache. If this domain was recently${R}\n`;
        o += `  ${D}visited, the cached IP is reused.${R}\n`;
        o += `       ${D}│${R}  ${D}Cache MISS${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 2 ──
        o += `  ${B}STEP 2${R} ${D}·${R} ${ANSI.blue}🖥️  OS / Router${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        o += `  ${D}The OS checks /etc/hosts and its${R}\n`;
        o += `  ${D}system DNS cache. If empty, it${R}\n`;
        o += `  ${D}forwards to the configured resolver.${R}\n`;
        o += `       ${D}│${R}  ${D}Forwarding upstream...${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 3 ──
        o += `  ${B}STEP 3${R} ${D}·${R} ${ANSI.yellow}🌐 Recursive Resolver${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        o += `  ${D}Your DNS server (e.g. 8.8.8.8 or${R}\n`;
        o += `  ${D}1.1.1.1) begins the recursive${R}\n`;
        o += `  ${D}resolution from the DNS root.${R}\n`;
        o += `       ${D}│${R}  ${D}"Who handles ${fullTLD}?"${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 4 ──
        o += `  ${B}STEP 4${R} ${D}·${R} ${ANSI.magenta}🌲 Root Servers (.)${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        o += `  ${D}13 root server clusters worldwide.${R}\n`;
        o += `  ${D}"I don't know ${domain},${R}\n`;
        o += `  ${D} but ${fullTLD} is managed by${R}\n`;
        o += `  ${D} ${tldOp ? W + tldOp + R : "its TLD operator"}."${R}\n`;
        o += `       ${D}│${R}  ${D}Referral → ${fullTLD} TLD${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 5 ──
        o += `  ${B}STEP 5${R} ${D}·${R} ${ANSI.cyan}🏷️  TLD Servers (${fullTLD})${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        if (tldOp) o += `  ${D}Operated by${R} ${W}${tldOp}${R}\n`;
        o += `  ${D}"${root} is delegated to:"${R}\n`;
        if (nsAll.length) {
            for (const ns of nsAll.slice(0, 4)) o += `  ${D}  →${R} ${W}${ns}${R}\n`;
            if (nsAll.length > 4) o += `  ${D}  ... +${nsAll.length - 4} more${R}\n`;
            if (nsProv) o += `  ${D}Provider:${R} ${ANSI.green}${nsProv}${R}\n`;
        } else {
            o += `  ${ANSI.red}  ✖ No NS records found${R}\n`;
        }
        o += `       ${D}│${R}  ${D}Referral → Auth NS${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 6 ──
        o += `  ${B}STEP 6${R} ${D}·${R} ${ANSI.green}📚 Authoritative NS${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        if (!ok && !nsAll.length) {
            o += `  ${ANSI.red}DNS Resolution Failure${R}\n`;
            o += `  ${D}The nameservers are unreachable${R}\n`;
            o += `  ${D}or misconfigured.${R}\n`;
        } else {
            o += `  ${D}Holds the definitive records for${R}\n`;
            o += `  ${D}${root}.${R}\n\n`;
            o += `  ${D}Query:${R}  A ${W}${domain}${R}\n`;
            if (cname) {
                o += `  ${D}Answer:${R} ${ANSI.yellow}CNAME${R} → ${W}${cname}${R}\n\n`;
                o += `  ${ANSI.yellow}⚡ Alias detected!${R}\n`;
                o += `  ${D}Following CNAME chain...${R}\n`;
                o += `  ${D}Query:${R}  A ${W}${cname}${R}\n`;
            }
            if (aIPs.length) {
                o += `  ${D}Answer:${R} ${W}${aIPs[0]}${R}`;
                if (aTTL) o += ` ${D}(TTL: ${aTTL}s)${R}`;
                o += `\n`;
                for (let i = 1; i < Math.min(aIPs.length, 3); i++) {
                    o += `          ${W}${aIPs[i]}${R}\n`;
                }
            } else {
                o += `  ${ANSI.red}Answer: No A record${R}\n`;
            }
            if (cdn) o += `  ${D}CDN:${R} ${ANSI.green}${cdn}${R}\n`;
        }
        o += `       ${D}│${R}  ${D}${ok ? "IP resolved!" : "Resolution failed"}${R}\n`;
        o += `       ${D}▼${R}\n\n`;

        // ── STEP 7 ──
        o += `  ${B}STEP 7${R} ${D}·${R} ${ANSI.red}🎯 Destination Server${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        if (!ok) {
            o += `  ${ANSI.red}DNS Resolution Failed${R}\n`;
            o += `  ${D}SERVFAIL / NXDOMAIN / Timeout${R}\n\n`;
            o += `       ${ANSI.red}✖  Cannot connect.${R}\n\n`;
        } else {
            o += `  ${D}TCP handshake →${R} ${W}${ip}:443${R}\n`;
            o += `  ${D}TLS negotiation → HTTPS ready${R}\n`;
            o += `  ${D}HTTP request sent...${R}\n\n`;
            o += `       ${ANSI.green}✔  200 OK · Page Loads!${R}\n\n`;
        }

        // ── SUMMARY ──
        o += `  ${D}${"━".repeat(45)}${R}\n`;
        o += `  ${B}Summary${R}\n`;
        o += `  ${D}${"─".repeat(32)}${R}\n`;
        o += `  ${D}Domain:${R}    ${W}${domain}${R}\n`;
        o += `  ${D}Resolved:${R}  ${ok ? W + ip + R : ANSI.red + "FAILED" + R}\n`;
        if (aIPs.length > 1) o += `  ${D}Alt IPs:${R}   ${D}${aIPs.slice(1, 3).join(", ")}${R}\n`;
        o += `  ${D}NS:${R}        ${nsAll.length ? W + (nsProv || nsAll[0]) + R : ANSI.red + "Unknown" + R}\n`;
        if (cname) o += `  ${D}CNAME:${R}     ${W}${cname}${R}\n`;
        if (cdn) o += `  ${D}CDN:${R}       ${ANSI.green}${cdn}${R}\n`;
        o += `  ${D}Hops:${R}      ${W}7${R} ${D}(Browser → Server)${R}\n\n`;

        return o;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
