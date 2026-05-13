/**
 * @module modules/data/defs/audit.js
 * @description Audit Suite category command definitions.
 */

export const AUDIT_COMMANDS = {
    email: {
        category: "AUDIT SUITE",
        desc: "MX+SPF+DMARC+DKIM",
        aliases: ["mail"],
        params: ["domain"],
        exec: async (args, flags) => (await import("../../commands/email/index.js")).cmdEmail(args, flags)
    },
    web: {
        category: "AUDIT SUITE",
        desc: "Core Web Checks (DNS+Headers+SSL)",
        params: ["domain"],
        subcommands: ["-audit", "-seo", "-og", "-schema", "-alt", "-full"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdWeb(args, flags)
    },
    extract: {
        category: "AUDIT SUITE",
        desc: "Page content extractor",
        params: ["domain"],
        subcommands: ["-emails", "-links", "-images", "-docs", "-phones", "-comments"],
        exec: async (args, flags) => (await import("../../commands/web/index.js")).cmdExtract(args, flags)
    }
};
