/**
 * @module modules/data/defs/misc.js
 * @description Miscellaneous and External category command definitions.
 */

export const MISC_COMMANDS = {
    about: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "WhatHappened project info",
        exec: async () => (await import("../../commands/util/index.js")).cmdAbout()
    },
    info: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Runtime environment details",
        exec: async () => (await import("../../commands/util/index.js")).cmdInfo()
    },
    exit: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Terminate current session",
        exec: async () => (await import("../../commands/util/index.js")).cmdExit()
    },
    errors: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "List system errors",
        aliases: ["error-list", "error"],
        exec: async () => (await import("../../commands/util/index.js")).cmdErrors()
    },
    ext: {
        category: "EXTERNAL",
        key: "external",
        desc: "External integrations menu",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdExt(args)
    },
    matrix: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Digital rain simulation",
        exec: async () => (await import("../../commands/util/index.js")).cmdMatrix()
    },
    snake: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Classic terminal snake",
        exec: async () => (await import("../../commands/util/index.js")).cmdSnake()
    },
    hack: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Infrastructure trivia quiz",
        aliases: ["trivia", "quiz"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdHack(args)
    },
    coffee: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Pomodoro timer",
        aliases: ["break", "pomodoro", "timer"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdCoffee(args)
    },
    dog: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Fetch random dog picture",
        aliases: ["perro", "mascota", "pet"],
        exec: async () => (await import("../../commands/util/index.js")).cmdDog()
    },
    btc: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Live Bitcoin price tracker",
        exec: async () => (await import("../../commands/util/index.js")).cmdBTC()
    },
    signal: {
        category: "FUN & EGGS",
        key: "fun",
        desc: "Terminal oscilloscope",
        aliases: ["intercept", "wave", "oscilloscope"],
        exec: async () => (await import("../../commands/util/index.js")).cmdSignal()
    },
    ssllabs: {
        category: "EXTERNAL",
        key: "external",
        desc: "Qualys SSL Labs deep scan",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSSLLabs(args)
    },
    blacklist: {
        category: "EXTERNAL",
        key: "external",
        desc: "Blacklist lookup",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdBlacklist(args)
    },
    securityheaders: {
        category: "EXTERNAL",
        key: "external",
        desc: "Header grade A+ to F",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSecurityHeaders(args)
    },
    "whois-ext": {
        category: "EXTERNAL",
        key: "external",
        desc: "ICANN/DomainTools",
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWhoisExt(args)
    }
};
