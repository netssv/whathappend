/**
 * @module modules/data/defs/email.js
 * @description Email category command definitions.
 */

export const EMAIL_COMMANDS = {
    spf: {
        category: "EMAIL",
        key: "email",
        desc: "SPF record",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdSPF(args)
    },
    dmarc: {
        category: "EMAIL",
        key: "email",
        desc: "DMARC policy",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDMARC(args)
    },
    dkim: {
        category: "EMAIL",
        key: "email",
        desc: "DKIM scan (dynamic)",
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDKIM(args)
    },
    deliverability: {
        category: "EMAIL",
        key: "email",
        desc: "Email deliverability optimization",
        aliases: ["optimiza"],
        params: ["domain"],
        exec: async (args) => (await import("../../commands/email/index.js")).cmdDeliverability(args)
    }
};
