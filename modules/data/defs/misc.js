/**
 * @module modules/data/defs/misc.js
 * @description Miscellaneous and External category command definitions.
 */

export const MISC_COMMANDS = {
    about: {
        category: "SYSTEM & UTILS",
        desc: "WhatHappened project info",
        exec: async () => (await import("../../commands/util/index.js")).cmdAbout()
    },
    info: {
        category: "SYSTEM & UTILS",
        desc: "Runtime environment details",
        exec: async () => (await import("../../commands/util/index.js")).cmdInfo()
    },
    exit: {
        category: "SYSTEM & UTILS",
        desc: "Terminate current session",
        exec: async () => (await import("../../commands/util/index.js")).cmdExit()
    },
    errors: {
        category: "SYSTEM & UTILS",
        desc: "List system errors",
        aliases: ["error-list", "error"],
        exec: async () => (await import("../../commands/util/index.js")).cmdErrors()
    },
    ext: {
        category: "EXTERNAL",
        desc: "External integrations menu",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdExt(args)
    },
    matrix: {
        category: "FUN & EGGS",
        desc: "Digital rain simulation",
        exec: async () => (await import("../../commands/util/index.js")).cmdMatrix()
    },
    snake: {
        category: "FUN & EGGS",
        desc: "Classic terminal snake",
        exec: async () => (await import("../../commands/util/index.js")).cmdSnake()
    },
    hack: {
        category: "FUN & EGGS",
        desc: "Infrastructure trivia quiz",
        aliases: ["trivia", "quiz"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdHack(args)
    },
    coffee: {
        category: "FUN & EGGS",
        desc: "Pomodoro timer",
        aliases: ["break", "pomodoro", "timer"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdCoffee(args)
    },
    dog: {
        category: "FUN & EGGS",
        desc: "Fetch random dog picture",
        aliases: ["perro", "mascota", "pet"],
        exec: async () => (await import("../../commands/util/index.js")).cmdDog()
    },
    btc: {
        category: "FUN & EGGS",
        desc: "Live Bitcoin price tracker",
        exec: async () => (await import("../../commands/util/index.js")).cmdBTC()
    },
    signal: {
        category: "FUN & EGGS",
        desc: "Terminal oscilloscope",
        aliases: ["intercept", "wave", "oscilloscope"],
        exec: async () => (await import("../../commands/util/index.js")).cmdSignal()
    },
    ssllabs: {
        category: "EXTERNAL",
        desc: "Qualys SSL Labs deep scan",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSSLLabs(args)
    },
    blacklist: {
        category: "EXTERNAL",
        desc: "Blacklist lookup",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdBlacklist(args)
    },
    securityheaders: {
        category: "EXTERNAL",
        desc: "Header grade A+ to F",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSecurityHeaders(args)
    },
    "whois-ext": {
        category: "EXTERNAL",
        desc: "ICANN/DomainTools",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWhoisExt(args)
    }
};
