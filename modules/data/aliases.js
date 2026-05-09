/**
 * @module modules/data/aliases.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: DNS_SHORTCUTS, DNS_TYPES, DNS_NUM, CMD_ALIASES, ALL_KNOWN_CMDS
 * - Layer: Data Layer - Static constants, dictionaries, and autocomplete datasets.
 */

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
    redirect: "trace", traceroute: "trace", follow: "trace", forwarding: "trace",
    // nslookup
    lookup: "nslookup",
    // sec / security
    security: "sec", scan: "sec",
    // web tools flags mapping
    "audit": "web -audit", "marketing": "web -audit",
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
    // socials
    "social": "socials",
    // stack / tech
    "tech": "stack", "techstack": "stack", "wappalyzer": "stack",
    // load / performance
    "perf": "load", "performance": "load", "pagespeed": "load", "timing": "load",
    // registrar
    "reg": "whois", "lifecycle": "whois", "registrar": "whois",
    // hosting
    "hoster": "hosting", "provider": "hosting", "webhost": "hosting",
    // exit
    "quit": "exit",
    // switch
    "sw": "switch", "actual": "switch", "current": "switch", "here": "switch",
    // tabs
    "tab": "tabs",
    // start
    "run": "start", "go": "start", "begin": "start", "analyze": "start",
    // config
    "settings": "config", "set": "config", "prefs": "config",
    // isup
    "upcheck": "isup", "down": "isup", "downcheck": "isup", "status": "isup",
    // jitter
    "latency-test": "jitter",
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
    // rank
    "ranking": "rank", "traffic": "rank",
    // seo
    "seo": "web -seo", "meta": "web -seo", "tags": "web -seo",
    // og
    "og": "web -og", "thaks": "web -og", "opengraph": "web -og", "cards": "web -og",
    // alt
    "alt": "web -alt", "images": "web -alt", "a11y": "web -alt",
    // reload
    "restart": "reload", "reboot": "reload",
    // waf
    "firewall": "waf", "cdn-check": "waf",
    // hsts
    "strict": "hsts", "secure-transport": "hsts",
    // minify
    "min": "minify", "assets": "minify",
    // schema
    "schema": "web -schema", "structured": "web -schema", "jsonld": "web -schema", "microdata": "web -schema",
    // headers-check
    "hcheck": "headers-check", "security-headers": "headers-check",
    // clip
    "copy": "clip", "clipboard": "clip",
    // matrix
    "rain": "matrix",
    // coffee
    "break": "coffee", "pomodoro": "coffee", "timer": "coffee",
    // sudo
    "su": "sudo",
    // propagation
    "global": "propagation", "resolve": "propagation",
    // deliverability
    "optimiza": "deliverability", "optimiza-mail": "deliverability",
    // dog
    "perro": "dog", "mascota": "dog", "pet": "dog",
    // snake
    "juego": "snake", "game": "snake", "play": "snake",
    // hack
    "trivia": "hack", "quiz": "hack",
    // signal
    "intercept": "signal", "wave": "signal", "oscilloscope": "signal",
    // useragent
    "ua": "useragent", "agent": "useragent", "spoof": "useragent",
    // mobile
    "mob": "mobile", "responsive": "mobile", "iphone": "mobile",
    // throttle
    "slow": "throttle", "lag": "throttle", "network": "throttle",
    // geo
    "gps": "geo", "location": "geo", "spoof-geo": "geo",
    // block
    "ban": "block", "deny": "block", "drop": "block",
    // fonts
    "typography": "fonts", "type": "fonts",
    // palette
    "colors": "palette", "theme": "palette",
    // comments
    "hidden": "comments", "notes": "comments", "note": "comments", "memo": "comments", "annotation": "comments",
    // cms
    "wordpress": "cms", "fingerprint": "cms",
    // malware
    "virus": "malware", "heuristics": "malware",
    // edit
    "designmode": "edit", "modify": "edit",
    // emails & phones
    "emails": "extract -emails", "scrape-emails": "extract -emails", "contacts": "extract -emails",
    "phones": "extract -phones", "scrape-phones": "extract -phones", "numbers": "extract -phones",
    // map
    "journey": "map", "flow": "map", "dns-map": "map", "path": "map",
    // fullscreen
    "f11": "fullscreen", "fs": "fullscreen",
    // nav
    "menu": "nav", "gui": "nav", "explorer": "nav",
    // watch
    "monitor": "watch", "live": "watch", "netwatch": "watch"
};

export const ALL_KNOWN_CMDS = [
    ...Object.keys(CMD_ALIASES),
    ...Object.keys(DNS_SHORTCUTS),
    "dig", "host", "nslookup", "curl", "openssl", "whois",
    "ping", "trace", "email", "web", "ttl", "spf", "dmarc",
    "dkim", "robots", "sec", "target", "help", "clear",
    "rev-dns", "port-scan", "ftp-check", "export",
    "blacklist", "ssllabs", "securityheaders", "whois-ext",
    "errors", "pixels", "socials", "stack", "load", "rank", "csp", "waf", "hsts", "minify", "diff", "headers-check",
    "registrar", "hosting", "exit", "switch", "reload",
    "start", "config", "isup", "jitter", "speedtest", "clip", "matrix", "coffee",
    "ip", "security-txt", "vitals", "flush", "tabs", "actual", "current", "here",
    "useragent", "mobile", "throttle", "geo", "block", "fonts", "palette", "comments", "cms", "malware", "edit", "map", "fullscreen", "nav", "watch"
].filter(c => /^[a-z]/i.test(c));
