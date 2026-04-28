/**
 * WhatHappened — Command Aliases & DNS Shortcuts
 * Static data — no runtime dependencies.
 */

export const DNS_SHORTCUTS = { a:"A", aaaa:"AAAA", mx:"MX", txt:"TXT", ns:"NS", cname:"CNAME", soa:"SOA" };
export const DNS_TYPES = ["A","AAAA","MX","TXT","CNAME","NS","SOA","DS","DNSKEY"];
export const DNS_NUM = {1:"A",2:"NS",5:"CNAME",6:"SOA",15:"MX",16:"TXT",28:"AAAA",43:"DS",48:"DNSKEY"};

export const CMD_ALIASES = {
    // clear
    cls: "clear", reset: "clear",
    // help
    ls: "help", commands: "help", man: "help",
    // curl / headers
    http: "curl", headers: "curl",
    // openssl / ssl
    ssl: "openssl", cert: "openssl", tls: "openssl",
    // trace / redirect
    redirect: "trace", traceroute: "trace", follow: "trace",
    // nslookup
    lookup: "nslookup",
    // sec / security
    security: "sec", scan: "sec",
    // web
    audit: "web",
    // email
    mail: "email",
    // whois
    domain: "whois",
    // ping
    latency: "ping",
    // robots
    sitemap: "robots",
    // dig
    dns: "dig", record: "dig",
    // rev-dns
    "reverse-dns": "rev-dns", "rdns": "rev-dns", "ptr": "rev-dns",
    // port-scan
    "ports": "port-scan", "nmap": "port-scan", "portscan": "port-scan",
    // ftp-check
    "ftp": "ftp-check",
    // export
    "dump": "export", "report": "export", "save": "export",
    // external lookups
    "bl": "blacklist", "rbl": "blacklist", "dnsbl": "blacklist",
    "ssltest": "ssllabs", "ssl-labs": "ssllabs",
    "sheaders": "securityheaders", "sec-headers": "securityheaders",
    "whoisext": "whois-ext", "icann": "whois-ext",
    // errors
    "error-list": "errors", "error": "errors",
    // pixels
    "tracking": "pixels", "trackers": "pixels", "pixel": "pixels", "ads": "pixels",
    // stack / tech
    "tech": "stack", "techstack": "stack", "wappalyzer": "stack", "cms": "stack",
    // load / performance
    "perf": "load", "performance": "load", "pagespeed": "load", "timing": "load",
    // registrar
    "reg": "registrar", "lifecycle": "registrar",
    // hosting
    "hoster": "hosting", "provider": "hosting", "webhost": "hosting",
    // exit
    "quit": "exit",
    // switch
    "sw": "switch", "tab": "switch",
    // start
    "run": "start", "go": "start", "begin": "start", "analyze": "start",
    // config
    "settings": "config", "set": "config", "prefs": "config",
    // isup
    "upcheck": "isup", "down": "isup", "downcheck": "isup", "status": "isup",
    // speed
    "jitter": "speed", "latency-test": "speed",
    // speedtest
    "bandwidth": "speedtest", "nettest": "speedtest",
    // ip
    "myip": "ip", "public-ip": "ip",
    // security-txt
    "sec-txt": "security-txt", "securitytxt": "security-txt",
    // vitals
    "cwv": "vitals", "web-vitals": "vitals", "core-vitals": "vitals",
    // flush
    "clearcache": "flush", "clear-cache": "flush",
    // notes
    "note": "notes", "memo": "notes", "annotation": "notes",
};

export const ALL_KNOWN_CMDS = [
    ...Object.keys(CMD_ALIASES),
    ...Object.keys(DNS_SHORTCUTS),
    "dig", "host", "nslookup", "curl", "openssl", "whois",
    "ping", "trace", "email", "web", "ttl", "spf", "dmarc",
    "dkim", "robots", "sec", "target", "help", "clear",
    "rev-dns", "port-scan", "ftp-check", "export",
    "blacklist", "ssllabs", "securityheaders", "whois-ext",
    "errors", "pixels", "stack", "load",
    "registrar", "hosting", "exit", "switch",
    "start", "config", "isup", "speed", "speedtest",
    "ip", "security-txt", "vitals", "flush", "notes",
].filter(c => /^[a-z]/i.test(c));
