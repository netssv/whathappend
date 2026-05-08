/**
 * @module modules/data/trivia/junior.js
 * @description Junior-level trivia — Fundamentals of DNS, HTTP, SEO, and Web Security.
 */

export const JUNIOR_QUESTIONS = [
    // ═══════════════════════════════════════════════════════════════
    // DNS BASICS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "Which DNS record maps a domain name to an IPv4 address?",
        opts: ["AAAA", "A", "CNAME", "MX"],
        ans: 1,
        exp: "An A record (Address record) maps a hostname to a 32-bit IPv4 address."
    },
    {
        q: "Which DNS record maps a domain name to an IPv6 address?",
        opts: ["A", "AAAA", "CNAME", "MX"],
        ans: 1,
        exp: "AAAA records specify IPv6 addresses (128-bit), whereas A records are for IPv4."
    },
    {
        q: "What does a CNAME record do?",
        opts: ["Maps an IP to a domain", "Maps a domain to another domain", "Specifies the mail server", "Defines the authoritative name server"],
        ans: 1,
        exp: "CNAME (Canonical Name) aliases one domain name to another."
    },
    {
        q: "Which protocol does DNS primarily use for standard queries?",
        opts: ["TCP port 53", "UDP port 53", "TCP port 80", "UDP port 443"],
        ans: 1,
        exp: "DNS primarily uses UDP port 53 for fast, stateless queries. TCP is used for zone transfers or large responses."
    },
    {
        q: "What does the TTL (Time To Live) in a DNS record determine?",
        opts: ["How long the domain is registered for", "How long resolvers should cache the record", "The maximum number of hops", "How many times a record can be queried"],
        ans: 1,
        exp: "TTL dictates how long (in seconds) a DNS resolver should cache the response."
    },
    {
        q: "What is the primary purpose of a DNS TXT record?",
        opts: ["Routing emails", "Alias mapping", "Storing text notes & security policies like SPF", "Securing DNS responses"],
        ans: 2,
        exp: "TXT records hold arbitrary text, widely used for SPF, DKIM, and site verification."
    },
    {
        q: "Which DNS record specifies the mail server responsible for receiving email?",
        opts: ["A", "NS", "MX", "TXT"],
        ans: 2,
        exp: "MX (Mail Exchange) records point to the mail server(s) for a domain."
    },
    {
        q: "What does 'DNS Propagation' refer to?",
        opts: ["The time to register a new domain", "The time for DNS changes to update across global resolvers", "The process of encrypting a DNS query", "A method used in DDoS attacks"],
        ans: 1,
        exp: "Because of TTL caching, it takes time for updated records to propagate to all global DNS servers."
    },
    {
        q: "What DNS record resolves an IP address back to a hostname?",
        opts: ["A", "PTR", "SOA", "SRV"],
        ans: 1,
        exp: "PTR (Pointer) records are used for reverse DNS lookups."
    },
    {
        q: "In an MX record, what does a lower priority value indicate?",
        opts: ["Lower security", "The server is less preferred", "The server is more preferred", "Faster latency"],
        ans: 2,
        exp: "A lower preference/priority number means the mail server is more preferred."
    },

    // ═══════════════════════════════════════════════════════════════
    // HTTP & WEB BASICS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What HTTP status code means 'OK — request succeeded'?",
        opts: ["301", "200", "404", "500"],
        ans: 1,
        exp: "HTTP 200 is the standard success response for a request."
    },
    {
        q: "What HTTP status code means 'Page Not Found'?",
        opts: ["200", "301", "403", "404"],
        ans: 3,
        exp: "404 indicates the server cannot find the requested resource."
    },
    {
        q: "What HTTP status code means 'Internal Server Error'?",
        opts: ["403", "404", "500", "503"],
        ans: 2,
        exp: "500 indicates an unexpected server-side error."
    },
    {
        q: "What does HTTPS provide that HTTP does not?",
        opts: ["Faster loading times", "Encrypted communication via TLS/SSL", "Better SEO rankings", "Larger file uploads"],
        ans: 1,
        exp: "HTTPS encrypts traffic using TLS to protect data in transit from eavesdroppers."
    },
    {
        q: "Which HTTP method is used to retrieve data without modifying it?",
        opts: ["POST", "PUT", "GET", "DELETE"],
        ans: 2,
        exp: "GET requests are read-only and should not modify server state."
    },
    {
        q: "What does a 301 HTTP status code indicate?",
        opts: ["Temporary redirect", "Permanent redirect", "Not Modified", "Bad Request"],
        ans: 1,
        exp: "301 means the resource has moved permanently to a new URL."
    },
    {
        q: "What does a 403 HTTP status code mean?",
        opts: ["Not Found", "Unauthorized", "Forbidden — access denied", "Server Error"],
        ans: 2,
        exp: "403 means the server understood the request but refuses to authorize it."
    },
    {
        q: "Which file gives instructions to web crawlers about which pages they can or cannot visit?",
        opts: ["sitemap.xml", "index.html", "humans.txt", "robots.txt"],
        ans: 3,
        exp: "robots.txt is the standard file used to restrict or allow crawler access to specific paths."
    },
    {
        q: "What is a cookie in the context of web browsers?",
        opts: ["A type of malware", "A small piece of data stored by the browser for a website", "An encryption key", "A browser extension"],
        ans: 1,
        exp: "Cookies are small key-value data stored by browsers, used for sessions, preferences, and tracking."
    },
    {
        q: "What port does HTTPS typically use?",
        opts: ["80", "21", "443", "8080"],
        ans: 2,
        exp: "HTTPS uses port 443 by default, while HTTP uses port 80."
    },

    // ═══════════════════════════════════════════════════════════════
    // SEO BASICS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What does SEO stand for?",
        opts: ["Server Engine Optimization", "Search Engine Optimization", "Secure Encrypted Output", "System Error Override"],
        ans: 1,
        exp: "SEO refers to techniques for improving a website's visibility in search engine results."
    },
    {
        q: "What does the 'alt' attribute on an image tag do for SEO?",
        opts: ["Speeds up image loading", "Provides descriptive text for screen readers and search engines", "Forces Google Images indexing", "Adds a tooltip on hover"],
        ans: 1,
        exp: "Alt text describes the image content, aiding accessibility and helping search bots understand context."
    },
    {
        q: "Which HTML tag is most important for SEO on a page?",
        opts: ["<div>", "<span>", "<title>", "<footer>"],
        ans: 2,
        exp: "The <title> tag is one of the most important SEO signals — it appears in search results."
    },
    {
        q: "What is a sitemap.xml used for?",
        opts: ["Blocking crawlers", "Listing all indexable pages for search engines", "Storing website passwords", "Configuring server settings"],
        ans: 1,
        exp: "An XML Sitemap helps search engines discover and understand the structure of a site's pages."
    },
    {
        q: "What is the purpose of a meta description?",
        opts: ["Define page CSS styles", "Provide a summary for search engine results", "Set the page encoding", "Link JavaScript files"],
        ans: 1,
        exp: "Meta descriptions appear as the snippet text under the title in search results."
    },

    // ═══════════════════════════════════════════════════════════════
    // SECURITY BASICS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What does SSL stand for?",
        opts: ["Secure Socket Layer", "Server Security Lock", "System Safety Link", "Secure System Login"],
        ans: 0,
        exp: "SSL (Secure Sockets Layer) is the predecessor to TLS, used to encrypt network communication."
    },
    {
        q: "What is the purpose of a firewall?",
        opts: ["Speed up internet connection", "Monitor and control network traffic based on rules", "Store website backups", "Encrypt emails"],
        ans: 1,
        exp: "Firewalls filter incoming and outgoing traffic based on predetermined security rules."
    },
    {
        q: "What does 'phishing' mean in cybersecurity?",
        opts: ["A type of DDoS attack", "Tricking users into revealing sensitive information via fake websites/emails", "A DNS exploitation technique", "Scanning for open ports"],
        ans: 1,
        exp: "Phishing uses social engineering to trick victims into providing credentials or personal data."
    },
    {
        q: "What is two-factor authentication (2FA)?",
        opts: ["Using two passwords", "A security method requiring two different forms of verification", "Double-encrypting data", "Having two firewalls"],
        ans: 1,
        exp: "2FA adds a second verification layer (e.g., SMS code, authenticator app) beyond just a password."
    },
    {
        q: "What does a VPN do?",
        opts: ["Speeds up your internet", "Creates an encrypted tunnel for your network traffic", "Removes viruses", "Blocks ads"],
        ans: 1,
        exp: "A VPN (Virtual Private Network) encrypts your traffic and routes it through a remote server."
    },
];
