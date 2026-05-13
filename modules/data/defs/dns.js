/**
 * @module modules/data/defs/dns.js
 * @description DNS category command definitions.
 */

export const DNS_COMMANDS = {
    dig: {
        category: "DNS",
        desc: "Full DNS [+short]",
        aliases: ["dns", "record"],
        params: ["domain"],
        subcommands: ["-a", "-aaaa", "-mx", "-txt", "-ns", "-cname", "-soa", "+short", "+trace"],
        exec: async (args, flags, opts) => (await import("../../commands/dns/index.js")).cmdDig(args, { flags, opts })
    },
    host: {
        category: "DNS",
        desc: "A + AAAA + MX",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdHost(args)
    },
    nslookup: {
        category: "DNS",
        desc: "Name server lookup",
        aliases: ["lookup"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdNslookup(args)
    },
    ttl: {
        category: "DNS",
        desc: "TTL all records",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdTTL(args)
    },
    dnssec: {
        category: "DNS",
        desc: "DNSSEC zone auth",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdDnssec(args)
    },
    propagation: {
        category: "DNS",
        desc: "Global DNS propagation check",
        aliases: ["global", "resolve"],
        params: ["domain"],
        exec: async (args, flags, opts) => (await import("../../commands/dns/index.js")).cmdPropagation(args, { opts })
    },
    map: {
        category: "DNS",
        desc: "Visualize the DNS resolution journey",
        aliases: ["journey", "flow"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/dns/index.js")).cmdMap(args)
    }
};
