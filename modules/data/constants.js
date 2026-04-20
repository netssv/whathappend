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

// All provider resolution (IP, NS, Web) is handled dynamically via RDAP

export const PORT_SERVICES = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
    993: "IMAPS", 995: "POP3S", 3306: "MySQL",
    3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
};
