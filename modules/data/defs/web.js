/**
 * @module modules/data/defs/web.js
 * @description Web Core category command definitions.
 */

export const WEB_COMMANDS = {
    curl: {
        category: "WEB CORE",
        key: "web",
        desc: "HTTP headers",
        aliases: ["http", "headers"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCurl(args)
    },
    openssl: {
        category: "WEB CORE",
        key: "web",
        desc: "SSL/TLS cert",
        aliases: ["ssl", "cert", "tls"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdOpenSSL(args)
    },
    whois: {
        category: "WEB CORE",
        key: "web",
        desc: "Domain WHOIS",
        aliases: ["domain", "reg", "registrar"],
        params: ["domain"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdWhois(args, flags)
    },
    hosting: {
        category: "WEB CORE",
        key: "web",
        desc: "IP hosting provider",
        aliases: ["provider", "webhost"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdLoad(args) // Corrected from registry
    },
    history: {
        category: "WEB CORE",
        key: "web",
        desc: "Cert transparency logs",
        aliases: ["crt"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHistory(args)
    },
    trace: {
        category: "WEB CORE",
        key: "web",
        desc: "Redirect chain",
        aliases: ["redirect", "follow"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdTrace(args)
    },
    robots: {
        category: "WEB CORE",
        key: "web",
        desc: "robots.txt",
        aliases: ["sitemap"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdRobots(args)
    },
    "security-txt": {
        category: "WEB CORE",
        key: "web",
        desc: "Security contact (RFC 9116)",
        aliases: ["sec-txt"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/security-txt.js")).cmdSecurityTxt(args)
    },
    cookies: {
        category: "WEB CORE",
        key: "web",
        desc: "Privacy cookies audit",
        params: ["domain"],
        subcommands: ["-persist", "-keepalive", "-stop"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdCookies(args, flags)
    },
    diff: {
        category: "WEB CORE",
        key: "web",
        desc: "Compare two pages",
        params: ["domain1", "domain2"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdDiff(args)
    },
    edit: {
        category: "WEB CORE",
        key: "web",
        desc: "Enable page edit mode",
        aliases: ["designmode", "modify"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdEdit(args)
    },
    links: {
        category: "WEB CORE",
        key: "web",
        desc: "External link audit",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdLinks(args)
    },
    wayback: {
        category: "WEB CORE",
        key: "web",
        desc: "Internet Archive history",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWayback(args)
    },
    green: {
        category: "WEB CORE",
        key: "web",
        desc: "Green energy check",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdGreen(args)
    },
    fonts: {
        category: "DESIGN & UI",
        key: "web",
        desc: "Font/Typography audit",
        aliases: ["typography", "type"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdFonts(args)
    },
    palette: {
        category: "DESIGN & UI",
        key: "web",
        desc: "Color palette extractor",
        aliases: ["colors", "theme"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdPalette(args)
    },
    comments: {
        category: "AUDIT SUITE",
        key: "web",
        desc: "Hidden HTML comments",
        aliases: ["hidden", "notes"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdComments(args)
    },
    cms: {
        category: "AUDIT SUITE",
        key: "web",
        desc: "Platform fingerprinting",
        aliases: ["wordpress", "fingerprint"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCms(args)
    },
    malware: {
        category: "SECURITY",
        key: "audit",
        desc: "Domain reputation check",
        aliases: ["virus", "heuristics"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdMalware(args)
    }
};
