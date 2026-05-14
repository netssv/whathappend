/**
 * @module modules/data/defs/perf.js
 * @description Perf & UI category command definitions.
 */

export const PERF_COMMANDS = {
    ping: {
        category: "PERF & UI",
        key: "perf",
        desc: "HTTP latency",
        aliases: ["latency"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdPing(args)
    },
    rank: {
        category: "PERF & UI",
        key: "perf",
        desc: "Global traffic rank",
        aliases: ["ranking", "traffic"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdRank(args)
    },
    links: {
        category: "PERF & UI",
        key: "perf",
        desc: "Mixed content scan",
        aliases: ["src"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdLinks(args)
    },
    wayback: {
        category: "PERF & UI",
        key: "perf",
        desc: "Archive.org timeline",
        aliases: ["archive"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWayback(args)
    },
    green: {
        category: "PERF & UI",
        key: "perf",
        desc: "Green energy host",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdGreen(args)
    },
    pixels: {
        category: "PERF & UI",
        key: "perf",
        desc: "Ad/tracking pixels",
        aliases: ["tracking", "ads"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdPixels(args)
    },
    socials: {
        category: "PERF & UI",
        key: "perf",
        desc: "Social media presence",
        aliases: ["social"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSocials(args)
    },
    stack: {
        category: "PERF & UI",
        key: "perf",
        desc: "Technology stack",
        aliases: ["tech", "wappalyzer"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/stack/index.js")).cmdStack(args)
    },
    minify: {
        category: "PERF & UI",
        key: "perf",
        desc: "Asset minification check",
        aliases: ["min"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdMinify(args)
    },
    load: {
        category: "PERF & UI",
        key: "perf",
        desc: "Performance timing",
        aliases: ["perf", "timing"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdLoad(args)
    },
    vitals: {
        category: "PERF & UI",
        key: "perf",
        desc: "Core Web Vitals",
        aliases: ["cwv", "web-vitals"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/vitals.js")).cmdVitals(args)
    },
    fonts: {
        category: "PERF & UI",
        key: "perf",
        desc: "Loaded web typography",
        aliases: ["typography", "type"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdFonts(args)
    },
    palette: {
        category: "PERF & UI",
        key: "perf",
        desc: "Extract color palette",
        aliases: ["colors", "theme"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdPalette(args)
    }
};
