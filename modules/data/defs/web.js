/**
 * @module modules/data/defs/web.js
 * @description Web Core category command definitions.
 */

export const WEB_COMMANDS = {
    curl: {
        category: "WEB CORE",
        desc: "HTTP headers",
        aliases: ["http", "headers"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCurl(args)
    },
    openssl: {
        category: "WEB CORE",
        desc: "SSL/TLS cert",
        aliases: ["ssl", "cert", "tls"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdOpenSSL(args)
    },
    whois: {
        category: "WEB CORE",
        desc: "Domain WHOIS",
        aliases: ["domain", "reg", "registrar"],
        params: ["domain"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdWhois(args, flags)
    },
    hosting: {
        category: "WEB CORE",
        desc: "IP hosting provider",
        aliases: ["provider", "webhost"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdLoad(args) // Corrected from registry
    },
    history: {
        category: "WEB CORE",
        desc: "Cert transparency logs",
        aliases: ["crt"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHistory(args)
    },
    trace: {
        category: "WEB CORE",
        desc: "Redirect chain",
        aliases: ["redirect", "follow"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdTrace(args)
    },
    robots: {
        category: "WEB CORE",
        desc: "robots.txt",
        aliases: ["sitemap"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdRobots(args)
    },
    "security-txt": {
        category: "WEB CORE",
        desc: "Security contact (RFC 9116)",
        aliases: ["sec-txt"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/security-txt.js")).cmdSecurityTxt(args)
    },
    cookies: {
        category: "WEB CORE",
        desc: "Privacy cookies audit",
        params: ["domain"],
        subcommands: ["-persist", "-keepalive", "-stop"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdCookies(args, flags)
    }
};
