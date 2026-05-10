/**
 * @module modules/commands/util/detailed-help-dns.js
 * @description Help entries for DNS and email diagnostic commands.
 *              (dig, host, nslookup, a/aaaa/mx/txt/ns/cname, soa, ttl,
 *               spf, dmarc, dkim, deliverability, dnssec, propagation, map, email)
 *
 * @connections
 * - Imports: formatHelp, sh from './detailed-help.js'
 * - Exports: DNS_HELP
 * - Layer: Command Layer (Util) — data only.
 */

import { formatHelp, sh } from "./detailed-help.js";

export const DNS_HELP = {
    dig: () => formatHelp({ name: "dig", syntax: "[domain] [type] [+short]", descLines: [
        "Query the DNS system for raw resource records.",
        "",
        "WHAT IS IT?",
        "  DNS is the phonebook of the internet. Every domain name maps to",
        "  records that tell browsers where to connect, what servers handle",
        "  email, and how to verify ownership.",
        "",
        "REAL USE CASES:",
        "  - Confirm an A record points to the expected IP after a migration.",
        "  - Retrieve MX records to verify mail server configuration.",
        "  - Add +short to strip noise and get just the value.",
        "  - Types: A, AAAA, MX, TXT, NS, CNAME, SOA.",
    ], aliases: "dns, record", examples: [
        { cmd: "dig google.com MX",          desc: "List mail servers" },
        { cmd: "dig google.com A +short",    desc: "Just the IP address" },
        { cmd: "dig google.com TXT",         desc: "SPF / verification records" },
    ]}),

    host:     () => formatHelp({ name: "host", syntax: "[domain]", descLines: [
        "Quickly resolve the IP address and mail server for a domain.",
        "Returns A, AAAA, and MX records in a single lookup.",
    ], aliases: null, examples: [{ cmd: "host google.com" }] }),

    nslookup: () => formatHelp({ name: "nslookup", syntax: "[domain]", descLines: [
        "Identify the authoritative name servers managing a domain.",
        "Useful for confirming DNS delegation is correct after setup.",
    ], aliases: "lookup", examples: [{ cmd: "nslookup google.com" }] }),

    a:    () => sh("a",    "A",    "Find the IPv4 address (where the website is hosted)."),
    aaaa: () => sh("aaaa", "AAAA", "Find the IPv6 address."),
    mx:   () => sh("mx",   "MX",   "Mail servers — who receives email for this domain?"),
    txt:  () => sh("txt",  "TXT",  "Text records — used for SPF, DKIM, and ownership verification."),
    ns:   () => sh("ns",   "NS",   "Nameservers — who manages the DNS settings?"),
    cname:() => sh("cname","CNAME","Domain aliases, e.g. www points to the root domain."),

    soa: () => formatHelp({ name: "soa", syntax: "[domain]", descLines: [
        "Start of Authority record — core metadata for a DNS zone.",
        "",
        "WHAT IS IT?",
        "  The SOA record identifies the primary nameserver, the admin",
        "  contact email, and the timing parameters (refresh, retry, expiry,",
        "  and minimum TTL) that control how secondary servers sync.",
        "",
        "REAL USE CASES:",
        "  - Check if a DNS migration has propagated to the primary NS.",
        "  - Retrieve the admin email when WHOIS is privacy-protected.",
        "  - Inspect serial numbers to debug caching or replication lag.",
    ], aliases: null, examples: [
        { cmd: "soa google.com", desc: "Show SOA record" },
        { cmd: "soa",            desc: "Active tab domain" },
    ]}),

    email: () => formatHelp({ name: "email", syntax: "[domain]", descLines: [
        "Comprehensive email infrastructure audit.",
        "",
        "WHAT IS IT?",
        "  Checks MX records (can the domain receive mail?), then validates",
        "  SPF, DMARC, and DKIM to confirm anti-spoofing is in place.",
        "",
        "REAL USE CASES:",
        "  - Diagnose why emails from a domain land in spam.",
        "  - Verify a new domain is ready to send and receive email.",
        "  - Check if a competitor's domain is vulnerable to email spoofing.",
    ], aliases: "mail", examples: [
        { cmd: "email google.com",  desc: "Full audit" },
        { cmd: "email",             desc: "Active tab domain" },
    ]}),

    ttl: () => formatHelp({ name: "ttl", syntax: "[domain]", descLines: [
        "Check DNS Time-To-Live values.",
        "",
        "REAL USE CASES:",
        "  - Before a migration, lower TTL to 300s so the change propagates fast.",
        "  - After a migration, confirm TTL has been restored to normal (3600s+).",
        "  - Identify domains with very high TTL that slow down incident recovery.",
    ], aliases: null, examples: [{ cmd: "ttl google.com" }] }),

    spf: () => formatHelp({ name: "spf", syntax: "[domain]", descLines: [
        "Sender Policy Framework audit.",
        "",
        "WHAT IS IT?",
        "  SPF is a TXT DNS record that lists which mail servers are allowed",
        "  to send email on behalf of a domain. Missing or misconfigured SPF",
        "  causes legitimate emails to be rejected or marked as spam.",
        "",
        "REAL USE CASES:",
        "  - Verify a third-party email service (SendGrid, Mailgun) is authorized.",
        "  - Check if the SPF record has too many DNS lookups (limit is 10).",
        "  - Confirm the domain uses -all (hard fail) instead of ~all (soft fail).",
    ], aliases: null, examples: [{ cmd: "spf google.com" }] }),

    dmarc: () => formatHelp({ name: "dmarc", syntax: "[domain]", descLines: [
        "DMARC enforcement policy check.",
        "",
        "WHAT IS IT?",
        "  DMARC tells receiving mail servers (Gmail, Outlook) what to do",
        "  when an email fails both SPF and DKIM: none, quarantine, or reject.",
        "",
        "REAL USE CASES:",
        "  - Check if a domain is protected against phishing impersonation.",
        "  - Confirm the policy is set to 'reject' (not just 'none').",
        "  - Retrieve the RUA report address to find who receives DMARC reports.",
    ], aliases: null, examples: [{ cmd: "dmarc google.com" }] }),

    dkim: () => formatHelp({ name: "dkim", syntax: "[domain] [selector]", descLines: [
        "DKIM signature record scanner.",
        "",
        "WHAT IS IT?",
        "  DKIM adds a cryptographic signature to outgoing emails so receivers",
        "  can verify the message was not altered in transit.",
        "  Selectors are inferred from MX/SPF records automatically.",
        "",
        "REAL USE CASES:",
        "  - Verify DKIM is published before switching email providers.",
        "  - Test a specific selector when debugging email delivery failures.",
        "  - Follow CNAME chains up to 3 levels deep for hosted DNS setups.",
    ], aliases: null, examples: [
        { cmd: "dkim google.com",           desc: "Auto-detect selector" },
        { cmd: "dkim google.com google",    desc: "Manual selector" },
    ]}),

    deliverability: () => formatHelp({ name: "deliverability", syntax: "[domain]", descLines: [
        "Email deliverability optimizer.",
        "Analyzes SPF, DKIM, and DMARC and suggests specific corrections",
        "for the most common causes of email landing in spam.",
    ], aliases: "optimiza, optimiza-mail", examples: [
        { cmd: "deliverability google.com" },
    ]}),

    dnssec: () => formatHelp({ name: "dnssec", syntax: "[domain]", descLines: [
        "DNS zone cryptographic integrity check.",
        "",
        "REAL USE CASES:",
        "  - Verify a domain is signed with DNSSEC (DS and DNSKEY present).",
        "  - Confirm a TLD registrar has published the DS record correctly.",
        "  - Check if a zone is vulnerable to DNS spoofing / cache poisoning.",
    ], aliases: null, examples: [{ cmd: "dnssec google.com" }] }),

    propagation: () => formatHelp({ name: "propagation", syntax: "[domain] [type]", descLines: [
        "Verify global DNS record propagation.",
        "",
        "WHAT IS IT?",
        "  Queries Google (8.8.8.8), Cloudflare (1.1.1.1), and Quad9 (9.9.9.9)",
        "  to check if a DNS change has reached public resolvers worldwide.",
        "",
        "REAL USE CASES:",
        "  - Confirm a new A record is live globally after a migration.",
        "  - Check if an MX record update has propagated before testing email.",
        "  - Debug split-brain DNS where results differ between resolvers.",
    ], aliases: "global, resolve", examples: [
        { cmd: "propagation google.com",     desc: "Check A record globally" },
        { cmd: "propagation example.com MX", desc: "Check MX propagation" },
    ]}),

    map: () => formatHelp({ name: "map", syntax: "[domain]", descLines: [
        "Visualize the full DNS resolution chain.",
        "",
        "WHAT IS IT?",
        "  Displays an ASCII diagram of the path from Root nameservers,",
        "  to TLD (.com / .net), to the domain's Authoritative nameserver.",
        "",
        "REAL USE CASES:",
        "  - Understand which NS is authoritative for a given domain.",
        "  - Debug delegation failures where a TLD points to the wrong NS.",
        "  - Explain DNS to clients or team members visually.",
    ], aliases: "journey, flow", examples: [
        { cmd: "map",              desc: "Active tab domain" },
        { cmd: "journey example.com" },
    ]}),
};
