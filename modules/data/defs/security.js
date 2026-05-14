/**
 * @module modules/data/defs/security.js
 * @description Security category command definitions.
 */

export const SECURITY_COMMANDS = {
    sec: {
        category: "SECURITY",
        key: "security",
        desc: "Security scorecard",
        aliases: ["scan", "security"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSec(args)
    },
    csp: {
        category: "SECURITY",
        key: "security",
        desc: "Content-Security-Policy",
        aliases: ["xss"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCsp(args)
    },
    waf: {
        category: "SECURITY",
        key: "security",
        desc: "WAF / CDN detection",
        aliases: ["firewall"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWaf(args)
    },
    hsts: {
        category: "SECURITY",
        key: "security",
        desc: "HSTS policy audit",
        aliases: ["strict"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHsts(args)
    },
    "headers-check": {
        category: "SECURITY",
        key: "security",
        desc: "Security header checklist",
        aliases: ["hcheck"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHeadersCheck(args)
    },
    comments: {
        category: "SECURITY",
        key: "security",
        desc: "Hidden HTML/JS comments",
        aliases: ["hidden"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdComments(args)
    },
    cms: {
        category: "SECURITY",
        key: "security",
        desc: "CMS fingerprinting",
        aliases: ["wordpress"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCms(args)
    },
    malware: {
        category: "SECURITY",
        key: "security",
        desc: "Client-side malware heuristic",
        aliases: ["virus"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdMalware(args)
    }
};
