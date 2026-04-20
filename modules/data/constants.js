/**
 * WhatHappened — Centralized Constants & RegExp
 */

export const REGEX = {
    IP_V4: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    IP_V6: /^[0-9a-fA-F:]+$/,
    URL_PROTOCOL: /^https?:\/\//,
    URL_PATH: /\/.*$/,
    ANSI_STRIP: /\x1b\[[0-9;]*m/g,
    TRAILING_DOT: /\.$/,
};

export const CONFIG = {
    TIMEOUT_HTTP: 2000,
    TIMEOUT_PING: 20000,
    TIMEOUT_SSL: 10000,
    TIMEOUT_WHOIS: 10000,
};

export const CLOUDFLARE_IPS = [
    "104.16.","104.17.","104.18.","104.19.","104.20.","104.21.","104.22.",
    "104.23.","104.24.","104.25.","172.67.","103.21.","103.22.","103.31.",
    "141.101.","108.162.","190.93.","188.114.","197.234.","198.41."
];

// Static IP prefix → Provider map (for IPs without PTR records)
export const IP_PROVIDERS = [
    // Imperva / Incapsula (WAF)
    { prefix: "45.60.",   name: "Imperva / Incapsula" },
    { prefix: "107.154.", name: "Imperva / Incapsula" },
    { prefix: "199.83.",  name: "Imperva / Incapsula" },
    { prefix: "198.143.", name: "Imperva / Incapsula" },
    { prefix: "149.126.", name: "Imperva / Incapsula" },
    { prefix: "103.28.",  name: "Imperva / Incapsula" },
    // AWS Global Accelerator
    { prefix: "13.248.",  name: "AWS Global Accelerator" },
    { prefix: "76.223.",  name: "AWS Global Accelerator" },
    { prefix: "99.83.",   name: "AWS Global Accelerator" },
    // Sucuri (WAF)
    { prefix: "192.124.", name: "Sucuri WAF" },
    { prefix: "185.93.",  name: "Sucuri WAF" },
    // Fastly CDN
    { prefix: "151.101.", name: "Fastly CDN" },
    { prefix: "199.232.", name: "Fastly CDN" },
    // Google
    { prefix: "142.250.", name: "Google" },
    { prefix: "172.217.", name: "Google" },
    { prefix: "216.239.", name: "Google" },
    { prefix: "74.125.",  name: "Google" },
    { prefix: "209.85.",  name: "Google" },
    // Microsoft / Azure
    { prefix: "20.190.",  name: "Microsoft Azure" },
    { prefix: "40.126.",  name: "Microsoft Azure" },
    { prefix: "13.107.",  name: "Microsoft" },
    { prefix: "204.79.",  name: "Microsoft" },
    // Akamai CDN
    { prefix: "23.32.",   name: "Akamai CDN" },
    { prefix: "23.33.",   name: "Akamai CDN" },
    { prefix: "23.34.",   name: "Akamai CDN" },
    { prefix: "23.35.",   name: "Akamai CDN" },
    { prefix: "23.36.",   name: "Akamai CDN" },
    { prefix: "23.37.",   name: "Akamai CDN" },
    { prefix: "23.38.",   name: "Akamai CDN" },
    { prefix: "23.39.",   name: "Akamai CDN" },
    { prefix: "23.40.",   name: "Akamai CDN" },
    { prefix: "23.41.",   name: "Akamai CDN" },
    { prefix: "23.42.",   name: "Akamai CDN" },
    { prefix: "23.43.",   name: "Akamai CDN" },
    { prefix: "23.44.",   name: "Akamai CDN" },
    { prefix: "23.45.",   name: "Akamai CDN" },
    { prefix: "23.46.",   name: "Akamai CDN" },
    { prefix: "23.47.",   name: "Akamai CDN" },
    { prefix: "23.48.",   name: "Akamai CDN" },
    { prefix: "23.49.",   name: "Akamai CDN" },
    { prefix: "23.50.",   name: "Akamai CDN" },
    { prefix: "23.51.",   name: "Akamai CDN" },
    { prefix: "23.52.",   name: "Akamai CDN" },
    { prefix: "23.53.",   name: "Akamai CDN" },
    { prefix: "23.54.",   name: "Akamai CDN" },
    { prefix: "23.55.",   name: "Akamai CDN" },
    { prefix: "23.56.",   name: "Akamai CDN" },
    { prefix: "23.57.",   name: "Akamai CDN" },
    { prefix: "23.58.",   name: "Akamai CDN" },
    { prefix: "23.59.",   name: "Akamai CDN" },
    { prefix: "23.60.",   name: "Akamai CDN" },
    { prefix: "23.61.",   name: "Akamai CDN" },
    { prefix: "23.62.",   name: "Akamai CDN" },
    { prefix: "23.63.",   name: "Akamai CDN" },
    { prefix: "23.64.",   name: "Akamai CDN" },
    { prefix: "23.65.",   name: "Akamai CDN" },
    { prefix: "23.66.",   name: "Akamai CDN" },
    { prefix: "23.67.",   name: "Akamai CDN" },
    // StackPath / Highwinds
    { prefix: "151.139.", name: "StackPath CDN" },
    // KeyCDN
    { prefix: "104.126.", name: "KeyCDN" },
    // Limelight Networks
    { prefix: "156.154.", name: "Limelight Networks" },
];

export function identifyIPProvider(ip) {
    if (!ip) return null;
    for (const entry of IP_PROVIDERS) {
        if (ip.startsWith(entry.prefix)) return entry.name;
    }
    return null;
}

export const HOSTING_PROVIDERS = {
    "amazonaws.com": "Amazon Web Services (AWS)",
    "awsdns": "Amazon Route 53",
    "cloudfront.net": "Amazon CloudFront",
    "1e100.net": "Google Cloud",
    "google.com": "Google",
    "googleusercontent.com": "Google Cloud",
    "azure.com": "Microsoft Azure",
    "azurewebsites.net": "Microsoft Azure",
    "cloudflare.com": "Cloudflare",
    "cloudflare.net": "Cloudflare",
    "fastly.net": "Fastly CDN",
    "akamai.net": "Akamai CDN",
    "akamaitechnologies.com": "Akamai CDN",
    "digitalocean.com": "DigitalOcean",
    "linode.com": "Linode (Akamai)",
    "vultr.com": "Vultr",
    "hetzner.com": "Hetzner",
    "hetzner.de": "Hetzner",
    "ovh.net": "OVH / OVHcloud",
    "hostpapa.com": "HostPapa",
    "bluehost.com": "Bluehost",
    "godaddy.com": "GoDaddy",
    "godaddy": "GoDaddy",
    "secureserver.net": "GoDaddy",
    "hostgator.com": "HostGator",
    "dreamhost.com": "DreamHost",
    "siteground.com": "SiteGround",
    "namecheap.com": "Namecheap",
    "ionos.com": "IONOS (1&1)",
    "rackspace.com": "Rackspace",
    "wpengine.com": "WP Engine",
    "netlify.com": "Netlify",
    "vercel.net": "Vercel",
    "herokuapp.com": "Heroku",
    "namefind.com": "GoDaddy / NameFind",
    "awsglobalaccelerator.com": "AWS Global Accelerator",
};

export function identifyHostingProvider(hostname) {
    const lower = (hostname || "").toLowerCase();
    for (const [pattern, name] of Object.entries(HOSTING_PROVIDERS)) {
        if (lower.includes(pattern)) return name;
    }
    return null;
}

export const PORT_SERVICES = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
    993: "IMAPS", 995: "POP3S", 3306: "MySQL",
    3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
};
