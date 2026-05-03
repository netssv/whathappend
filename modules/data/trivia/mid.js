/**
 * @module modules/data/trivia/mid.js
 * @description Mid-level trivia — Intermediate DNS, HTTP headers, SEO optimization,
 *              email authentication, and web security techniques.
 */

export const MID_QUESTIONS = [
    // ═══════════════════════════════════════════════════════════════
    // DNS INTERMEDIATE
    // ═══════════════════════════════════════════════════════════════
    {
        q: "Which record specifies authoritative information about a DNS zone, including the primary name server?",
        opts: ["SOA", "NS", "PTR", "SRV"],
        ans: 0,
        exp: "The Start of Authority (SOA) record holds core administrative details about the zone."
    },
    {
        q: "What is the purpose of DNSSEC?",
        opts: ["Encrypt DNS queries to prevent snooping", "Provide cryptographic authentication of DNS data", "Speed up DNS resolution", "Hide the origin IP of a website"],
        ans: 1,
        exp: "DNSSEC adds digital signatures to DNS records to ensure they haven't been tampered with."
    },
    {
        q: "What is a DNS zone transfer (AXFR)?",
        opts: ["Transferring a domain to a new registrar", "Replicating a zone file from primary to secondary name servers", "Migrating DNS from one protocol to another", "Encrypting DNS queries"],
        ans: 1,
        exp: "AXFR is used by secondary DNS servers to replicate the entire zone database from the primary server."
    },
    {
        q: "What is DNS-over-HTTPS (DoH)?",
        opts: ["A faster DNS protocol", "DNS queries sent over encrypted HTTPS connections", "DNS for HTTP-only websites", "A method to bypass firewalls"],
        ans: 1,
        exp: "DoH encrypts DNS queries within HTTPS traffic, preventing ISPs and middleboxes from snooping on lookups."
    },
    {
        q: "Which DNS record type is used to define service locations (e.g., SIP, XMPP)?",
        opts: ["MX", "SRV", "PTR", "NAPTR"],
        ans: 1,
        exp: "SRV records specify hostname, port, priority, and weight for service discovery."
    },
    {
        q: "What is a wildcard DNS record?",
        opts: ["A record that points to all IPs", "A record matching any subdomain not explicitly defined", "A record used only for testing", "A record that bypasses TTL caching"],
        ans: 1,
        exp: "A wildcard record (*.example.com) catches requests to any undefined subdomain."
    },
    {
        q: "What is the 'dig' command used for?",
        opts: ["Downloading files", "Querying DNS servers for records", "Editing zone files", "Scanning ports"],
        ans: 1,
        exp: "dig (Domain Information Groper) is the standard CLI tool for performing DNS lookups."
    },

    // ═══════════════════════════════════════════════════════════════
    // HTTP HEADERS & PROTOCOLS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What HTTP header controls browser caching behavior?",
        opts: ["Content-Type", "Cache-Control", "X-Forwarded-For", "Accept-Encoding"],
        ans: 1,
        exp: "Cache-Control directives (max-age, no-cache, no-store) dictate how browsers and CDNs cache responses."
    },
    {
        q: "What is the purpose of the Content-Security-Policy (CSP) header?",
        opts: ["Compress responses", "Define which sources of content the browser is allowed to load", "Set cookie attributes", "Redirect HTTP to HTTPS"],
        ans: 1,
        exp: "CSP restricts the origins from which scripts, styles, images, and other resources can be loaded."
    },
    {
        q: "What does the X-Content-Type-Options: nosniff header do?",
        opts: ["Blocks images from loading", "Prevents the browser from MIME-type sniffing", "Disables JavaScript", "Hides the server version"],
        ans: 1,
        exp: "This header prevents browsers from interpreting files as a different MIME type than declared."
    },
    {
        q: "What is an HTTP redirect chain?",
        opts: ["Multiple servers handling one request", "A series of consecutive redirects from URL to URL", "A chain of API calls", "Multiple DNS queries"],
        ans: 1,
        exp: "Redirect chains (e.g., 301→302→200) add latency and can dilute SEO link equity."
    },
    {
        q: "What does the 'User-Agent' HTTP header contain?",
        opts: ["The server's operating system", "Information about the client's browser and OS", "The user's IP address", "Cookie data"],
        ans: 1,
        exp: "User-Agent identifies the browser, version, and OS to help servers deliver appropriate content."
    },
    {
        q: "What is the difference between HTTP 302 and 301?",
        opts: ["302 is permanent, 301 is temporary", "301 is permanent, 302 is temporary", "No difference", "302 is for errors, 301 is for success"],
        ans: 1,
        exp: "301 signals a permanent move (SEO equity transfers), while 302 is a temporary redirect."
    },
    {
        q: "What does the HTTP 503 status code mean?",
        opts: ["Payment Required", "Not Found", "Service Unavailable", "Bad Gateway"],
        ans: 2,
        exp: "503 indicates the server is temporarily unable to handle the request (maintenance, overload)."
    },

    // ═══════════════════════════════════════════════════════════════
    // EMAIL AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What does SPF (Sender Policy Framework) do?",
        opts: ["Encrypts email content", "Specifies which servers are allowed to send email for a domain", "Filters spam emails", "Compresses email attachments"],
        ans: 1,
        exp: "SPF uses a DNS TXT record to define which IPs/servers are authorized senders for the domain."
    },
    {
        q: "In an SPF record, what does the '-all' qualifier mean?",
        opts: ["Soft fail (accept but mark)", "Hard fail (reject unauthorized senders)", "Neutral (do nothing)", "Allow all senders"],
        ans: 1,
        exp: "The '-' (dash) prefix indicates a Hard Fail, instructing receivers to reject unauthorized emails."
    },
    {
        q: "What is DKIM used for?",
        opts: ["Encrypting email subject lines", "Digitally signing emails to verify the sender's identity", "Blocking spam filters", "Compressing email headers"],
        ans: 1,
        exp: "DKIM adds a cryptographic signature to email headers, verified using a public key in DNS TXT records."
    },
    {
        q: "What does DMARC stand for?",
        opts: ["Domain Mail Authentication Report Control", "Domain-based Message Authentication, Reporting & Conformance", "Direct Mail Access Record Check", "DNS Mail Anti-Replay Certificate"],
        ans: 1,
        exp: "DMARC builds on SPF and DKIM to define how receivers handle failed authentication."
    },

    // ═══════════════════════════════════════════════════════════════
    // SEO INTERMEDIATE
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What is the purpose of a canonical tag in SEO?",
        opts: ["Define the main language", "Prevent duplicate content issues", "Block crawlers", "Boost keyword density"],
        ans: 1,
        exp: "The rel='canonical' tag tells search engines which version of a URL is the master/primary one."
    },
    {
        q: "Which meta tag tells search engines NOT to index a specific page?",
        opts: ["<meta name='robots' content='noindex'>", "<meta name='seo' content='hide'>", "<meta name='googlebot' content='ignore'>", "<meta name='index' content='false'>"],
        ans: 0,
        exp: "The 'noindex' robots meta tag instructs search engines not to show the page in results."
    },
    {
        q: "In Web Vitals, what does LCP stand for?",
        opts: ["Largest Contentful Paint", "Low CSS Performance", "Latest Content Payload", "Loading Cache Protocol"],
        ans: 0,
        exp: "Largest Contentful Paint measures loading performance (time to render the largest visible element)."
    },
    {
        q: "What is the primary metric used by Google to measure visual stability?",
        opts: ["First Input Delay (FID)", "Cumulative Layout Shift (CLS)", "Time to Interactive (TTI)", "Total Blocking Time (TBT)"],
        ans: 1,
        exp: "CLS measures how much the page layout shifts unexpectedly during loading."
    },
    {
        q: "What structured data format does Google recommend for rich snippets?",
        opts: ["Microdata", "RDFa", "JSON-LD", "XML"],
        ans: 2,
        exp: "Google recommends JSON-LD because it's easiest to implement and maintain via script tags."
    },
    {
        q: "What is an Open Graph (OG) tag used for?",
        opts: ["SEO keyword targeting", "Controlling how a page appears when shared on social media", "Defining API endpoints", "Browser caching rules"],
        ans: 1,
        exp: "Open Graph meta tags define the title, image, and description shown in social media link previews."
    },

    // ═══════════════════════════════════════════════════════════════
    // WEB SECURITY INTERMEDIATE
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What does Cross-Site Scripting (XSS) allow an attacker to do?",
        opts: ["Execute SQL queries on the database", "Inject malicious JavaScript into pages viewed by users", "Crash the web server", "Bypass TLS encryption"],
        ans: 1,
        exp: "XSS vulnerabilities allow attackers to run malicious scripts in the victim's browser."
    },
    {
        q: "Which HTTP header defends against Clickjacking attacks?",
        opts: ["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "X-XSS-Protection"],
        ans: 2,
        exp: "X-Frame-Options (or CSP frame-ancestors) prevents a site from being embedded in an iframe."
    },
    {
        q: "What is the purpose of the HSTS header?",
        opts: ["Force browsers to only use HTTPS", "Cache static assets", "Prevent SQL injection", "Hide the server IP"],
        ans: 0,
        exp: "Strict-Transport-Security (HSTS) ensures the browser only communicates over HTTPS connections."
    },
    {
        q: "What does a CSRF vulnerability exploit?",
        opts: ["The server's lack of input validation", "The user's active, authenticated session", "The database's missing encryption", "The DNS resolver's cache"],
        ans: 1,
        exp: "Cross-Site Request Forgery tricks an authenticated user's browser into executing unwanted actions."
    },
    {
        q: "Which cookie attribute prevents JavaScript from accessing the cookie?",
        opts: ["Secure", "SameSite", "HttpOnly", "Path"],
        ans: 2,
        exp: "The HttpOnly flag ensures the cookie cannot be read via document.cookie, mitigating XSS theft."
    },
    {
        q: "What does CORS stand for?",
        opts: ["Cross-Origin Resource Sharing", "Centralized Object Routing System", "Client-Oriented Request Security", "Cascading Origin Response System"],
        ans: 0,
        exp: "CORS is a mechanism that allows restricted resources to be requested from another domain."
    },
    {
        q: "What is the main function of a WAF (Web Application Firewall)?",
        opts: ["Filter malware from downloads", "Block malicious HTTP traffic like SQLi and XSS", "Encrypt database connections", "Serve cached content"],
        ans: 1,
        exp: "A WAF inspects HTTP traffic and blocks malicious payloads targeting web vulnerabilities."
    },

    // ═══════════════════════════════════════════════════════════════
    // RECON & TOOLS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What information does a WHOIS lookup provide?",
        opts: ["Website traffic stats", "Domain registration details like registrar, dates, and contact info", "SSL certificate data", "DNS cache contents"],
        ans: 1,
        exp: "WHOIS queries reveal registrar, creation/expiry dates, name servers, and sometimes registrant details."
    },
    {
        q: "What is Certificate Transparency (CT)?",
        opts: ["Encrypting certificate private keys", "A public log system where CAs must record all issued certificates", "A way to hide SSL certificates", "A certificate revocation protocol"],
        ans: 1,
        exp: "CT logs allow domain owners to detect mis-issued certificates for their domains."
    },
    {
        q: "What does the 'nslookup' command do?",
        opts: ["Traces network routes", "Queries a DNS server for domain name resolution", "Scans for open ports", "Checks SSL certificates"],
        ans: 1,
        exp: "nslookup interactively queries DNS servers to obtain domain name or IP address mapping."
    },
    {
        q: "What does a reverse DNS lookup resolve?",
        opts: ["A domain to its IP", "An IP address to its associated hostname", "A URL to its redirect chain", "An email to its sender"],
        ans: 1,
        exp: "Reverse DNS uses PTR records to map an IP address back to a hostname."
    },
    {
        q: "What does the 'ping' command measure?",
        opts: ["Download speed", "Round-trip latency to a host", "Available disk space", "CPU usage"],
        ans: 1,
        exp: "Ping sends ICMP echo requests and measures the time for a response (round-trip time)."
    },
];
