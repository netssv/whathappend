/**
 * @module modules/data/defs/security.js
 * @description Security category command definitions.
 */

export const SECURITY_COMMANDS = {
    sec: {
        category: "SECURITY",
        desc: "Security scorecard",
        aliases: ["scan", "security"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSec(args)
    },
    csp: {
        category: "SECURITY",
        desc: "Content-Security-Policy",
        aliases: ["xss"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCsp(args)
    },
    waf: {
        category: "SECURITY",
        desc: "WAF / CDN detection",
        aliases: ["firewall"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWaf(args)
    },
    hsts: {
        category: "SECURITY",
        desc: "HSTS policy audit",
        aliases: ["strict"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHsts(args)
    },
    "headers-check": {
        category: "SECURITY",
        desc: "Security header checklist",
        aliases: ["hcheck"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdHeadersCheck(args)
    },
    comments: {
        category: "SECURITY",
        desc: "Hidden HTML/JS comments",
        aliases: ["hidden"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdComments(args)
    },
    cms: {
        category: "SECURITY",
        desc: "CMS fingerprinting",
        aliases: ["wordpress"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdCms(args)
    },
    malware: {
        category: "SECURITY",
        desc: "Client-side malware heuristic",
        aliases: ["virus"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdMalware(args)
    }
};
