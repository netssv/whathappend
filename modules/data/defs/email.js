/**
 * @module modules/data/defs/email.js
 * @description Email category command definitions.
 */

export const EMAIL_COMMANDS = {
    spf: {
        category: "EMAIL",
        desc: "SPF record",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdSPF(args)
    },
    dmarc: {
        category: "EMAIL",
        desc: "DMARC policy",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDMARC(args)
    },
    dkim: {
        category: "EMAIL",
        desc: "DKIM scan (dynamic)",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDKIM(args)
    },
    deliverability: {
        category: "EMAIL",
        desc: "Email deliverability optimization",
        aliases: ["optimiza"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDeliverability(args)
    }
};
