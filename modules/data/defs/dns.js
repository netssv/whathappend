/**
 * @module modules/data/defs/dns.js
 * @description DNS category command definitions.
 */

export const DNS_COMMANDS = {
    dig: {
        category: "DNS",
        key: "dns",
        desc: "Full DNS [+short]",
        aliases: ["dns", "record"],
        params: ["domain"],
        subcommands: ["-a", "-aaaa", "-mx", "-txt", "-ns", "-cname", "-soa", "+short", "+trace"],
        exec: async (args, flags, opts) => (await import("../../commands/dns/index.js")).cmdDig(args, { flags, opts })
    },
    host: {
        category: "DNS",
        key: "dns",
        desc: "A + AAAA + MX",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdHost(args)
    },
    nslookup: {
        category: "DNS",
        key: "dns",
        desc: "Name server lookup",
        aliases: ["lookup"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdNslookup(args)
    },
    ttl: {
        category: "DNS",
        key: "dns",
        desc: "TTL all records",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdTTL(args)
    },
    dnssec: {
        category: "DNS",
        key: "dns",
        desc: "DNSSEC zone auth",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdDnssec(args)
    },
    propagation: {
        category: "DNS",
        key: "dns",
        desc: "Global DNS propagation check",
        aliases: ["global", "resolve"],
        params: ["domain"],
        exec: async (args, flags, opts) => (await import("../../commands/dns/index.js")).cmdPropagation(args, { opts })
    },
    map: {
        category: "DNS",
        key: "dns",
        desc: "Visualize the DNS resolution journey",
        aliases: ["journey", "flow"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdMap(args)
    }
};
