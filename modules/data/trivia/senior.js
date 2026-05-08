/**
 * @module modules/data/trivia/senior.js
 * @description Senior-level trivia — Advanced DNS attacks, protocol internals,
 *              exploit techniques, infrastructure hardening, and deep recon.
 */

export const SENIOR_QUESTIONS = [
    // ═══════════════════════════════════════════════════════════════
    // ADVANCED DNS & PROTOCOL
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What is DNS cache poisoning?",
        opts: ["Deleting a DNS cache", "Injecting forged DNS responses so resolvers cache false records", "Encrypting DNS traffic", "Overloading a DNS server with queries"],
        ans: 1,
        exp: "Cache poisoning tricks resolvers into caching malicious DNS responses, redirecting users to attacker-controlled servers."
    },
    {
        q: "What is a DNS amplification attack?",
        opts: ["Using DNS to encrypt traffic", "Exploiting open resolvers to flood a victim with amplified DNS responses", "Increasing DNS TTL for faster resolution", "Duplicating DNS zones across multiple servers"],
        ans: 1,
        exp: "Attackers send small queries with a spoofed source IP to open resolvers, which reply with much larger responses to the victim."
    },
    {
        q: "What is DNS rebinding?",
        opts: ["Changing DNS records frequently to avoid detection", "An attack where a malicious DNS server alternates between its own IP and a target's internal IP", "Restarting DNS services automatically", "Binding multiple domains to one IP"],
        ans: 1,
        exp: "DNS rebinding bypasses same-origin policy by making a domain resolve to an internal IP after initial page load."
    },
    {
        q: "In DNSSEC, what type of record holds the cryptographic signature for a set of DNS records?",
        opts: ["DNSKEY", "RRSIG", "DS", "NSEC"],
        ans: 1,
        exp: "RRSIG records contain the digital signature that authenticates a specific set of DNS resource records."
    },
    {
        q: "What is the NSEC record used for in DNSSEC?",
        opts: ["Encrypting zone transfers", "Proving the non-existence of a DNS record", "Storing the zone signing key", "Redirecting unsigned queries"],
        ans: 1,
        exp: "NSEC/NSEC3 records prove that a queried name does not exist, preventing enumeration of zone contents."
    },
    {
        q: "What is an EDNS Client Subnet (ECS) extension used for?",
        opts: ["Encrypting DNS queries", "Passing partial client IP info to authoritative servers for geo-aware responses", "Compressing DNS packets", "Authenticating DNS responses"],
        ans: 1,
        exp: "ECS helps CDNs and geo-DNS providers return optimal results based on the client's approximate location."
    },
    {
        q: "What is DNS tunneling?",
        opts: ["A fast DNS resolution method", "Encoding arbitrary data within DNS queries/responses to bypass firewalls", "Encrypting DNS with TLS", "Routing DNS through a VPN"],
        ans: 1,
        exp: "DNS tunneling abuses the DNS protocol to exfiltrate data or establish C2 channels through restrictive firewalls."
    },
    {
        q: "What does the CAA (Certification Authority Authorization) DNS record do?",
        opts: ["Encrypts certificate requests", "Specifies which Certificate Authorities are allowed to issue certs for the domain", "Revokes expired certificates", "Stores the SSL private key"],
        ans: 1,
        exp: "CAA records let domain owners restrict which CAs can issue certificates, reducing mis-issuance risk."
    },

    // ═══════════════════════════════════════════════════════════════
    // ADVANCED WEB SECURITY & EXPLOITATION
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What is a Stored XSS attack?",
        opts: ["XSS payload in the URL only", "Malicious script permanently saved on the server and served to all visitors", "XSS that requires user interaction", "XSS limited to a single session"],
        ans: 1,
        exp: "Stored (persistent) XSS is the most dangerous type — the payload is saved in the database and executed for every visitor."
    },
    {
        q: "What is the difference between Reflected and DOM-based XSS?",
        opts: ["Reflected modifies the DOM; DOM-based modifies the server", "Reflected payload comes from the server response; DOM-based executes entirely client-side", "They are the same thing", "DOM-based requires server access"],
        ans: 1,
        exp: "In DOM-based XSS, the payload never reaches the server — it's processed entirely by client-side JavaScript."
    },
    {
        q: "What is Server-Side Request Forgery (SSRF)?",
        opts: ["Spoofing the server's IP address", "Tricking the server into making requests to internal/unintended resources", "Forging SSL certificates", "Injecting SQL into server logs"],
        ans: 1,
        exp: "SSRF exploits server functionality to access internal services, metadata endpoints, or private networks."
    },
    {
        q: "What is a race condition vulnerability in web applications?",
        opts: ["A performance bottleneck", "When two processes access shared data concurrently leading to unexpected behavior", "A DNS resolution timing issue", "When CSS animations conflict"],
        ans: 1,
        exp: "Race conditions occur when the outcome depends on the timing of concurrent operations, exploitable for double-spending or privilege escalation."
    },
    {
        q: "What is Content Security Policy (CSP) 'nonce' used for?",
        opts: ["Encrypting inline scripts", "Allowing specific inline scripts by matching a random token", "Blocking all JavaScript", "Caching script resources"],
        ans: 1,
        exp: "A CSP nonce is a random value that must match between the HTTP header and the script tag to allow execution."
    },
    {
        q: "What is 'Subdomain Takeover'?",
        opts: ["Transferring a subdomain to another registrar", "Claiming a dangling DNS record pointing to an unclaimed external service", "Blocking subdomain resolution", "Encrypting subdomain traffic"],
        ans: 1,
        exp: "When a subdomain's CNAME points to a deprovisioned service (e.g., deleted S3 bucket), an attacker can claim that service and control the subdomain's content."
    },
    {
        q: "What is HTTP Request Smuggling?",
        opts: ["Hiding data in HTTP cookies", "Exploiting discrepancies between front-end and back-end HTTP parsing", "Encrypting HTTP requests", "Sending HTTP over DNS"],
        ans: 1,
        exp: "Request smuggling exploits differences in how proxies and servers parse Content-Length/Transfer-Encoding headers."
    },
    {
        q: "What is the 'p=reject' policy in a DMARC record?",
        opts: ["Marks failed emails as spam", "Tells receivers to delete/reject emails that fail SPF/DKIM", "Rejects all incoming emails", "Blocks domains with poor reputation"],
        ans: 1,
        exp: "p=reject is the strictest DMARC policy, instructing mail servers to discard unauthenticated emails."
    },

    // ═══════════════════════════════════════════════════════════════
    // ADVANCED INFRASTRUCTURE & HARDENING
    // ═══════════════════════════════════════════════════════════════
    {
        q: "What is HSTS Preloading?",
        opts: ["Caching HSTS headers locally", "Hardcoding a domain into the browser's built-in HTTPS-only list", "Pre-loading SSL certificates", "Automatically renewing HSTS headers"],
        ans: 1,
        exp: "Preloaded domains are compiled into browser source code, guaranteeing HTTPS even on the very first visit."
    },
    {
        q: "What is the 'Expect-CT' HTTP header used for?",
        opts: ["Expecting a specific Content-Type", "Enforcing Certificate Transparency compliance for the domain", "Setting cache expiration", "Defining CORS policies"],
        ans: 1,
        exp: "Expect-CT ensures the site's SSL certificate appears in public Certificate Transparency logs."
    },
    {
        q: "What is a 'security.txt' file (RFC 9116)?",
        opts: ["A server configuration file", "A standard for websites to define security contact info and vulnerability disclosure policies", "An encryption key file", "A firewall rule configuration"],
        ans: 1,
        exp: "security.txt (placed at /.well-known/security.txt) helps security researchers report vulnerabilities responsibly."
    },
    {
        q: "What is the SameSite cookie attribute designed to prevent?",
        opts: ["XSS attacks", "CSRF attacks by restricting cross-origin cookie sending", "SQL injection", "DNS spoofing"],
        ans: 1,
        exp: "SameSite=Strict/Lax prevents cookies from being sent with cross-site requests, mitigating CSRF."
    },
    {
        q: "In TLS, what is Perfect Forward Secrecy (PFS)?",
        opts: ["Using the same key for all sessions", "Ensuring past sessions cannot be decrypted even if the server's private key is later compromised", "A certificate validation method", "A method to speed up TLS handshakes"],
        ans: 1,
        exp: "PFS uses ephemeral key exchange (e.g., ECDHE) so each session has unique keys, protecting historical data."
    },
    {
        q: "What is the purpose of Subresource Integrity (SRI)?",
        opts: ["Minifying resources", "Verifying that fetched resources (CDN scripts) haven't been tampered with via hash comparison", "Caching third-party assets", "Blocking ad scripts"],
        ans: 1,
        exp: "SRI uses base64-encoded hashes in the integrity attribute to ensure external scripts/styles haven't been modified."
    },
    {
        q: "What is a 'Canary Token' in security monitoring?",
        opts: ["A bird-themed password", "A decoy resource that alerts you when accessed, indicating unauthorized activity", "An SSL certificate type", "A DNS failover mechanism"],
        ans: 1,
        exp: "Canary tokens are tripwires placed in systems — when triggered (file opened, URL visited), they alert the defender."
    },

    // ═══════════════════════════════════════════════════════════════
    // DEEP RECON & FORENSICS
    // ═══════════════════════════════════════════════════════════════
    {
        q: "When analyzing a webpage's DOM for client-side malware, which is a strong indicator of a hidden payload?",
        opts: ["Minified CSS files", "Inline JavaScript heavily using eval() and atob()", "Multiple <h2> tags", "console.log() statements"],
        ans: 1,
        exp: "Attackers frequently obfuscate malicious scripts using Base64 encoding (atob) and eval() execution."
    },
    {
        q: "Why is it important to filter 'image@2x.png' patterns when scraping emails from raw HTML?",
        opts: ["PNG files are too large", "@ is used in filenames for retina assets, creating false positives", "Images contain viruses", ".png is a reserved TLD"],
        ans: 1,
        exp: "Frontend frameworks use @ for resolution variants (@2x, @3x), which trick basic email regex patterns."
    },
    {
        q: "Which HTML attribute guarantees a link is intended to initiate a phone call?",
        opts: ["rel=\"phone\"", "href=\"call:\"", "href=\"tel:\"", "type=\"number\""],
        ans: 2,
        exp: "The 'tel:' URI scheme is the standard way to create clickable phone numbers on the web."
    },
    {
        q: "What does the JavaScript property 'document.designMode' do when set to 'on'?",
        opts: ["Enables responsive design mode", "Makes the entire HTML document editable in the browser", "Activates developer tools", "Enables design system variables"],
        ans: 1,
        exp: "document.designMode='on' turns the entire page into a live WYSIWYG editor."
    },
    {
        q: "What is 'certificate pinning' in mobile/web security?",
        opts: ["Physically securing a server", "Hardcoding expected certificate fingerprints to prevent MITM with rogue certs", "Pinning certificates to a DNS record", "Storing certificates in a browser cache"],
        ans: 1,
        exp: "Certificate pinning validates that the server's certificate matches a known fingerprint, defeating rogue CA attacks."
    },
    {
        q: "What is the purpose of the 'Referrer-Policy' HTTP header?",
        opts: ["Block all referrers", "Control how much referrer information is included when navigating away from a page", "Track user navigation", "Set CORS permissions"],
        ans: 1,
        exp: "Referrer-Policy controls whether the full URL, origin-only, or no referrer is sent with outgoing requests."
    },
    {
        q: "In a port scan, what does a 'filtered' result typically mean?",
        opts: ["The port is open", "A firewall is silently dropping packets to that port", "The service is running but needs authentication", "The port doesn't exist"],
        ans: 1,
        exp: "A 'filtered' result means probes are being dropped by a firewall or security device — no response is returned."
    },
    {
        q: "What is 'jitter' in the context of network diagnostics?",
        opts: ["Total bandwidth", "The variation in latency between consecutive packets", "Packet loss percentage", "DNS resolution time"],
        ans: 1,
        exp: "Jitter measures the inconsistency of latency — high jitter degrades real-time applications like VoIP and video."
    },
    {
        q: "What is the Wayback Machine primarily used for in web recon?",
        opts: ["Speeding up websites", "Viewing historical snapshots of websites from Internet Archive", "Testing website performance", "Scanning for malware"],
        ans: 1,
        exp: "The Wayback Machine (archive.org) captures historical versions of websites, useful for discovering removed content or old configurations."
    },
    {
        q: "What is BGP hijacking?",
        opts: ["Stealing a domain name", "Announcing unauthorized IP prefixes to reroute internet traffic through an attacker's network", "Exploiting DNS TTL values", "Injecting false ARP entries"],
        ans: 1,
        exp: "BGP hijacking manipulates Border Gateway Protocol routing announcements to intercept or blackhole traffic destined for specific IP ranges."
    },
];
