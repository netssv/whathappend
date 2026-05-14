/**
 * @module modules/data/defs/util.js
 * @description Utility and System command definitions.
 */

export const UTIL_COMMANDS = {
    target: {
        category: "SESSION & TABS",
        key: "tabs",
        desc: "Set target domain",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdTarget(args)
    },
    export: {
        category: "SESSION & TABS",
        key: "tabs",
        desc: "Save report",
        aliases: ["dump", "save"],
        exec: async (args) => (await import("../../commands/native/index.js")).cmdExport(args)
    },
    clip: {
        category: "SESSION & TABS",
        key: "tabs",
        desc: "Copy session to clipboard",
        aliases: ["copy", "clipboard"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdClip(args)
    },
    tabs: {
        category: "SESSION & TABS",
        key: "tabs",
        desc: "Interactive tab menu",
        aliases: ["tab"],
        subcommands: ["-list", "-close", "-info", "-diag", "-watch", "-block", "-sleep", "-focus", "-flush"],
        exec: async (args, flags) => (await import("../../commands/util/index.js")).cmdTabs(args, flags)
    },
    session: {
        category: "SESSION & TABS",
        key: "tabs",
        desc: "Manage terminal sessions",
        subcommands: ["list", "close"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdSession(args)
    },
    help: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Interactive documentation",
        subcommands: ["-audit", "-dns", "-email", "-web", "-net", "-ext", "-util"],
        exec: async (args, flags) => (await import("../../commands/util/index.js")).cmdHelp(args, flags)
    },
    sudo: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Elevate command privileges",
        aliases: ["su"],
        subcommands: ["-l", "--list"],
        exec: async (args, flags) => (await import("../../commands/util/index.js")).cmdSudo(args, flags)
    },
    config: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Preferences and settings",
        aliases: ["settings", "set", "prefs"],
        subcommands: ["timeout", "retry-timeout", "auto-triage", "tab-notify", "autoHide", "autoHideDelay", "expert-mode", "theme", "reset", "list"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdConfig(args)
    },
    flush: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Clear site-specific artifacts",
        aliases: ["clearcache", "clear-cache"],
        exec: async (args) => (await import("../../commands/web/flush.js")).cmdFlush(args)
    },
    reload: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Reload active tab",
        exec: async () => (await import("../../commands/util/index.js")).cmdReload()
    },
    refresh: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Refresh terminal state",
        exec: async () => (await import("../../commands/util/index.js")).cmdRefresh()
    },
    nav: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Platform GUI navigator",
        aliases: ["menu", "gui", "explorer"],
        exec: async () => (await import("../../commands/util/index.js")).cmdNavMenu()
    },
    fullscreen: {
        category: "SYSTEM & UTILS",
        key: "system",
        desc: "Toggle fullscreen mode",
        aliases: ["f11", "fs"],
        exec: async () => (await import("../../commands/util/index.js")).cmdFullscreen()
    }
};
