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
    ssllabs: {
        category: "EXTERNAL",
        desc: "Qualys SSL Labs deep scan",
        aliases: ["help -ext ssl"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSSLLabs(args)
    },
    blacklist: {
        category: "EXTERNAL",
        desc: "Blacklist lookup",
        aliases: ["help -ext bl"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdBlacklist(args)
    },
    securityheaders: {
        category: "EXTERNAL",
        desc: "Header grade A+ to F",
        aliases: ["help -ext headers"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSecurityHeaders(args)
    },
    "whois-ext": {
        category: "EXTERNAL",
        desc: "ICANN/DomainTools",
        aliases: ["help -ext whois"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdWhoisExt(args)
    }
};
