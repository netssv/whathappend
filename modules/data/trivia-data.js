/**
 * @module modules/data/trivia-data.js
 * @description Question bank for the 'hack' trivia command.
 */

export const TRIVIA_QUESTIONS = [
    // --- DNS ---
    {
        q: "Which DNS record is used to map a domain name to an IPv6 address?",
        opts: ["A", "AAAA", "CNAME", "MX"],
        ans: 1,
        exp: "AAAA records specify IPv6 addresses, whereas A records are for IPv4."
    },
    {
        q: "What is the primary purpose of a DNS TXT record?",
        opts: ["Routing emails", "Alias mapping", "Storing text notes & security policies like SPF", "Securing DNS responses"],
        ans: 2,
        exp: "TXT records hold arbitrary text, widely used for SPF, DKIM, and site verification."
    },
    {
        q: "Which protocol does DNS primarily use for standard queries?",
        opts: ["TCP port 53", "UDP port 53", "TCP port 80", "UDP port 443"],
        ans: 1,
        exp: "DNS primarily uses UDP port 53 for fast, stateless queries. TCP is used for zone transfers or large responses."
    },
    {
        q: "What does a CNAME record do?",
        opts: ["Maps an IP to a domain", "Maps a domain to another domain", "Specifies the mail server", "Defines the authoritative name server"],
        ans: 1,
        exp: "CNAME (Canonical Name) aliases one domain name to another."
    },
    {
        q: "What DNS record resolves an IP address back to a hostname?",
        opts: ["A", "PTR", "SOA", "SRV"],
        ans: 1,
        exp: "PTR (Pointer) records are used for reverse DNS lookups."
    },
    {
        q: "In an MX record, what does the priority value indicate?",
        opts: ["The physical distance of the server", "The order in which servers should be tried (lower is preferred)", "The maximum size of emails allowed", "The security level of the connection"],
        ans: 1,
        exp: "A lower preference/priority number means the mail server is more preferred."
    },
    {
        q: "What is the purpose of DNSSEC?",
        opts: ["Encrypt DNS queries to prevent snooping", "Provide cryptographic authentication of DNS data", "Speed up DNS resolution", "Hide the origin IP of a website"],
        ans: 1,
        exp: "DNSSEC adds digital signatures to DNS records to ensure they haven't been tampered with."
    },
    {
        q: "What does the TTL (Time To Live) in a DNS record determine?",
        opts: ["How long the domain is registered for", "How long resolvers should cache the record", "The maximum number of hops a packet can take", "How many times a record can be queried"],
        ans: 1,
        exp: "TTL dictates how long (in seconds) a DNS resolver should cache the response."
    },
    {
        q: "Which record specifies authoritative information about a DNS zone, including the primary name server and administrator email?",
        opts: ["SOA", "NS", "PTR", "SRV"],
        ans: 0,
        exp: "The Start of Authority (SOA) record holds core administrative details about the zone."
    },
    {
        q: "What is 'DNS Propagation'?",
        opts: ["The time it takes to register a new domain", "The time it takes for DNS changes to update across global resolvers", "The process of encrypting a DNS query", "A method used in DDoS attacks"],
        ans: 1,
        exp: "Because of TTL caching, it takes time for updated records to propagate to all global DNS servers."
    },

    // --- SEO ---
    {
        q: "What HTTP status code indicates that a page has permanently moved (ideal for SEO)?",
        opts: ["302 Found", "404 Not Found", "301 Moved Permanently", "500 Internal Error"],
        ans: 2,
        exp: "A 301 redirect passes the SEO ranking power (link equity) to the new URL."
    },
    {
        q: "Which meta tag tells search engines NOT to index a specific page?",
        opts: ["<meta name='robots' content='noindex'>", "<meta name='seo' content='hide'>", "<meta name='googlebot' content='ignore'>", "<meta name='index' content='false'>"],
        ans: 0,
        exp: "The 'noindex' robots meta tag explicitly instructs search engines not to show the page in results."
    },
    {
        q: "What is the purpose of a canonical tag in SEO?",
        opts: ["To define the main language of the page", "To prevent duplicate content issues", "To block crawlers from the site", "To boost keyword density"],
        ans: 1,
        exp: "The rel='canonical' tag tells search engines which version of a URL is the master/primary one."
    },
    {
        q: "Which file gives instructions to web crawlers about which pages they can or cannot visit?",
        opts: ["sitemap.xml", "index.html", "humans.txt", "robots.txt"],
        ans: 3,
        exp: "robots.txt is the standard file used to restrict or allow crawler access to specific paths."
    },
    {
        q: "In Web Vitals, what does LCP stand for?",
        opts: ["Largest Contentful Paint", "Low CSS Performance", "Latest Content Payload", "Loading Cache Protocol"],
        ans: 0,
        exp: "Largest Contentful Paint measures loading performance (time to render the largest visible element)."
    },
    {
        q: "What is the primary metric used by Google to measure visual stability on a webpage?",
        opts: ["First Input Delay (FID)", "Cumulative Layout Shift (CLS)", "Time to Interactive (TTI)", "Total Blocking Time (TBT)"],
        ans: 1,
        exp: "CLS measures how much the page layout shifts unexpectedly during loading."
    },
    {
        q: "Which protocol is standard for submitting a list of all indexable pages to a search engine?",
        opts: ["RSS", "JSON-LD", "XML Sitemap", "robots.txt"],
        ans: 2,
        exp: "An XML Sitemap helps search engines discover and understand the structure of a site's pages."
    },
    {
        q: "What does the 'alt' attribute on an image tag do for SEO?",
        opts: ["Speeds up image loading", "Provides descriptive text for screen readers and search engines", "Forces the image to be indexed in Google Images", "Adds a tooltip when hovering over the image"],
        ans: 1,
        exp: "Alt text describes the image content, aiding accessibility and helping search bots understand the context."
    },
    {
        q: "What is the ideal HTTP status code for a page that has been permanently deleted and will never return?",
        opts: ["404 Not Found", "410 Gone", "503 Service Unavailable", "301 Redirect"],
        ans: 1,
        exp: "A 410 Gone tells search engines explicitly that the page was intentionally removed, speeding up de-indexing."
    },
    {
        q: "Which structured data format is most highly recommended by Google for rich snippets?",
        opts: ["Microdata", "RDFa", "JSON-LD", "XML"],
        ans: 2,
        exp: "Google recommends JSON-LD because it's easiest to implement and maintain via script tags."
    },

    // --- Web Security ---
    {
        q: "What does Cross-Site Scripting (XSS) allow an attacker to do?",
        opts: ["Execute SQL queries on the database", "Inject malicious JavaScript into webpages viewed by users", "Crash the web server via flood", "Bypass TLS encryption"],
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
        opts: ["To force browsers to only use HTTPS", "To cache static assets", "To prevent SQL injection", "To hide the server IP"],
        ans: 0,
        exp: "Strict-Transport-Security (HSTS) ensures the browser only communicates over secure HTTPS connections."
    },
    {
        q: "In an SPF record, what does the '-all' qualifier mean?",
        opts: ["Soft fail (accept but mark as spam)", "Hard fail (reject unauthorized senders)", "Neutral (do nothing)", "Allow all senders"],
        ans: 1,
        exp: "The '-' (dash) prefix indicates a Hard Fail, instructing receivers to reject emails not matching the SPF rules."
    },
    {
        q: "What does a CSRF vulnerability exploit?",
        opts: ["The server's lack of input validation", "The user's active, authenticated session", "The database's missing encryption", "The DNS resolver's cache"],
        ans: 1,
        exp: "Cross-Site Request Forgery tricks an authenticated user's browser into executing unwanted actions."
    },
    {
        q: "Which attribute prevents client-side scripts (like JavaScript) from accessing a cookie?",
        opts: ["Secure", "SameSite", "HttpOnly", "Path"],
        ans: 2,
        exp: "The HttpOnly flag ensures the cookie cannot be read via document.cookie, mitigating XSS theft."
    },
    {
        q: "What does CORS stand for?",
        opts: ["Cross-Origin Resource Sharing", "Centralized Object Routing System", "Client-Oriented Request Security", "Cascading Origin Response System"],
        ans: 0,
        exp: "CORS is a mechanism that allows restricted resources on a web page to be requested from another domain."
    },
    {
        q: "Which DNS record provides the public key needed to verify DKIM signatures?",
        opts: ["A", "MX", "TXT", "SRV"],
        ans: 2,
        exp: "DKIM uses TXT records to publish the cryptographic public key for email verification."
    },
    {
        q: "What does the 'p=reject' policy in a DMARC record do?",
        opts: ["Marks failed emails as spam", "Tells the receiver to delete/reject emails that fail SPF/DKIM", "Rejects all incoming emails to the domain", "Blocks domains with a poor sender reputation"],
        ans: 1,
        exp: "p=reject is the strictest DMARC policy, instructing mail servers to discard unauthenticated emails."
    },
    {
        q: "What is the main function of a WAF (Web Application Firewall)?",
        opts: ["Filter out malware from downloaded files", "Block malicious HTTP traffic like SQLi and XSS", "Encrypt internal database connections", "Serve cached content to speed up websites"],
        ans: 1,
        exp: "A WAF inspects HTTP traffic and blocks malicious payloads targeting web vulnerabilities."
    }
];
