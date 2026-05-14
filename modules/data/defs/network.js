/**
 * @module modules/data/defs/network.js
 * @description Network category command definitions.
 */

export const NETWORK_COMMANDS = {
    isup: {
        category: "NETWORK",
        key: "network",
        desc: "Local vs global parity",
        aliases: ["upcheck", "down"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdIsUp(args)
    },
    jitter: {
        category: "NETWORK",
        key: "network",
        desc: "Latency jitter test",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdJitter(args)
    },
    speedtest: {
        category: "NETWORK",
        key: "network",
        desc: "Local bandwidth test",
        aliases: ["bandwidth"],
        params: ["domain"],
        subcommands: ["10", "25", "50", "90"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdSpeedtest(args)
    },
    watch: {
        category: "NETWORK",
        key: "network",
        desc: "Live network dashboard",
        aliases: ["monitor", "live", "netwatch"],
        params: ["domain"],
        subcommands: ["raw", "waterfall", "log", "stream"],
        exec: async (args) => (await import("../../commands/util/index.js")).cmdWatch(args)
    },
    "rev-dns": {
        category: "NETWORK",
        key: "network",
        desc: "Reverse DNS (PTR)",
        aliases: ["rdns", "ptr"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/native/index.js")).cmdRevDNS(args)
    },
    "port-scan": {
        category: "NETWORK",
        key: "network",
        desc: "Port scanner",
        aliases: ["ports", "nmap"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/native/index.js")).cmdPortScan(args)
    },
    "ftp-check": {
        category: "NETWORK",
        key: "network",
        desc: "FTP banner grab",
        aliases: ["ftp"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/native/index.js")).cmdFTPCheck(args)
    },
    ip: {
        category: "NETWORK",
        key: "network",
        desc: "Public IP / domain IP",
        aliases: ["myip", "public-ip"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/web/index.js")).cmdIP(args)
    },
    grep: {
        category: "POSIX",
        key: "posix",
        desc: "Filter text output",
        exec: async (args, flags, opts, stdin) => (await import("../../commands/native/index.js")).cmdGrep(args, flags, opts, stdin)
    },
    wc: {
        category: "POSIX",
        key: "posix",
        desc: "Count lines/words/chars",
        exec: async (args, flags, opts, stdin) => (await import("../../commands/native/index.js")).cmdWc(args, flags, opts, stdin)
    },
    sort: {
        category: "POSIX",
        key: "posix",
        desc: "Sort text output",
        exec: async (args, flags, opts, stdin) => (await import("../../commands/native/index.js")).cmdSort(args, flags, opts, stdin)
    }
};
