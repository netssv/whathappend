/**
 * @module modules/data/menu-data.js
 * @description Static definitions for the interactive Platform Navigator menu.
 */

export const CATEGORIES = [
    {
        name: "🌐 Audits & Core (Auditorías Completas)",
        desc: "Deep scans bundling multiple checks.",
        commands: [
            { cmd: "web", desc: "DNS, HTTP Headers, and SSL cert checks." },
            { cmd: "email", desc: "MX, SPF, DMARC, and DKIM discovery." },
            { cmd: "audit", desc: "Marketing Suite (SEO, OpenGraph, Schema)." },
            { cmd: "sec", desc: "Security scorecard (Headers, SSL)." }
        ]
    },
    {
        name: "📡 Network & DNS (Red y DNS)",
        desc: "Infrastructure routing and lookup tools.",
        commands: [
            { cmd: "dig", desc: "Full DNS lookup (e.g. dig mx)." },
            { cmd: "host", desc: "Quick A, AAAA, MX summary." },
            { cmd: "isup", desc: "Global reachability and downtime check." },
            { cmd: "ip", desc: "Show your public IP or resolve a domain's IP." },
            { cmd: "speedtest", desc: "Local bandwidth test." }
        ]
    },
    {
        name: "🛡️ Security & OSINT (Seguridad)",
        desc: "Vulnerability analysis and intelligence.",
        commands: [
            { cmd: "wayback", desc: "Archive.org timeline." },
            { cmd: "history", desc: "Certificate Transparency logs (creation date)." },
            { cmd: "csp", desc: "Content-Security-Policy analysis." },
            { cmd: "waf", desc: "Web Application Firewall detection." }
        ]
    },
    {
        name: "⚡ Performance & Web (Rendimiento)",
        desc: "Stack footprint and browser telemetry.",
        commands: [
            { cmd: "stack", desc: "Fingerprint tech stack (CMS, server, etc)." },
            { cmd: "vitals", desc: "Core Web Vitals scorecard." },
            { cmd: "load", desc: "Navigation Timing API metrics." },
            { cmd: "links", desc: "Mixed content (HTTP on HTTPS) scanner." }
        ]
    },
    {
        name: "💻 Terminal Tools (Herramientas)",
        desc: "System utilities and environment control.",
        commands: [
            { cmd: "tabs", desc: "Interactive Tab manager." },
            { cmd: "ext", desc: "External Tools launcher." },
            { cmd: "coffee", desc: "Pomodoro break timer." },
            { cmd: "config", desc: "View or change preferences." },
            { cmd: "help", desc: "Display full command reference." }
        ]
    }
];
