/**
 * @module modules/data/defs/emulation.js
 * @description Emulation and Debugging category command definitions.
 */

export const EMULATION_COMMANDS = {
    useragent: {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Override browser User-Agent",
        aliases: ["ua", "agent", "spoof"],
        subcommands: ["reset", "clear", "off", "chrome", "safari", "bot"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdUserAgent(args)
    },
    mobile: {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Emulate mobile environment",
        aliases: ["mob", "responsive", "iphone"],
        subcommands: ["reset", "off", "desktop", "iphone", "android"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdMobile(args)
    },
    throttle: {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Simulate network conditions",
        aliases: ["slow", "lag", "network"],
        subcommands: ["5g", "4g", "fast3g", "slow3g", "edge", "offline", "reset", "off"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdThrottle(args)
    },
    geo: {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Spoof GPS coordinates",
        aliases: ["gps", "location", "spoof-geo"],
        subcommands: ["london", "nyc", "tokyo", "reset", "clear", "off"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdGeo(args)
    },
    "ip-spoof": {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Inject fake IP headers",
        aliases: ["fakeip", "spoof-ip"],
        subcommands: ["reset", "clear", "off", "1.1.1.1", "8.8.8.8"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdIPSpoof(args)
    },
    block: {
        category: "EMULATION & DEBUGGING",
        key: "emu",
        desc: "Toggle content blocking",
        aliases: ["ban", "deny", "drop"],
        subcommands: ["--list", "--clear", "js", "images", "cookies"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdBlock(args)
    }
};
