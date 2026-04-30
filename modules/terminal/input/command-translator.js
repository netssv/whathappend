/**
 * @module modules/terminal/input/command-translator.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: translateRawCommand
 * - Layer: Terminal Layer (Input) - Handles keyboard events, autocomplete, and history.
 */

// ===================================================================
//  Command Translator (Educational Feedback Loop)
//  Translates raw bash-like snippets into internal WhatHappened commands.
// ===================================================================

export function translateRawCommand(input) {
    const lowerInput = input.toLowerCase();
    let mappedInput = input;

    if (lowerInput.startsWith("ping -c 10 ") || lowerInput.startsWith("ping -c 4 ")) {
        const match = input.match(/ping -c (?:10|4) ([^\s]+)/);
        if (match) mappedInput = `speed ${match[1]}`;
    } else if (lowerInput.startsWith("curl -o /dev/null http://speedtest")) {
        const match = input.match(/(\d+)MB\.zip/);
        mappedInput = match ? `speedtest ${match[1]}` : "speedtest";
    } else if (lowerInput.startsWith("curl -w ") && lowerInput.includes("ttfb")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `load ${match[1]}`;
    } else if (lowerInput.startsWith("whois ") && lowerInput.includes("orgname")) {
        const match = input.match(/whois ([^\s]+)/);
        if (match) mappedInput = `hosting ${match[1]}`;
    } else if (lowerInput.startsWith("whois ") && lowerInput.includes("registrar")) {
        const match = input.match(/whois ([^\s]+)/);
        if (match) mappedInput = `registrar ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("set-cookie")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `cookies ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://api.thegreenwebfoundation.org")) {
        const match = input.match(/greencheck\/([^\s]+)/);
        if (match) mappedInput = `green ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s \"https://crt.sh")) {
        const match = input.match(/q=([^&]+)/);
        if (match) mappedInput = `history ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://") && lowerInput.includes("src|href")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `links ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://") && lowerInput.includes("google-analytics")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `pixels ${match[1]}`;
    } else if (lowerInput.startsWith("nc -z -v -w2 ")) {
        const parts = input.split(" ");
        if (parts.length > 4) mappedInput = `port-scan ${parts[4]} ${parts.slice(5).join(" ").replace("...", "")}`;
    } else if (lowerInput.startsWith("nc -v -w5 ")) {
        const parts = input.split(" ");
        if (parts.length > 3) mappedInput = `ftp-check ${parts[3]}`;
    } else if (lowerInput.startsWith("for sel in ")) {
        const match = input.match(/\._domainkey\.([^\s]+)/);
        if (match) mappedInput = `dkim ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("wappalyzer")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `stack ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("head -n 1")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `isup ${match[1]}`;
    } else if (lowerInput.startsWith("dig ") && lowerInput.includes("+short")) {
        const parts = lowerInput.split(" ");
        if (parts.length >= 3) {
            const domain = parts[1];
            const type = parts[2];
            if (["a", "aaaa", "mx", "txt", "ns", "cname", "soa"].includes(type)) {
                mappedInput = `${type} ${domain}`;
            }
        }
    }

    return mappedInput;
}
