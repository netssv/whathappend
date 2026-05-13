/**
 * @module modules/data/command-manifest.js
 * @description Centralized Source of Truth for all terminal commands.
 */

import { AUDIT_COMMANDS } from "./defs/audit.js";
import { SECURITY_COMMANDS } from "./defs/security.js";
import { DNS_COMMANDS } from "./defs/dns.js";
import { EMAIL_COMMANDS } from "./defs/email.js";
import { WEB_COMMANDS } from "./defs/web.js";
import { PERF_COMMANDS } from "./defs/perf.js";
import { NETWORK_COMMANDS } from "./defs/network.js";
import { UTIL_COMMANDS } from "./defs/util.js";
import { EMULATION_COMMANDS } from "./defs/emulation.js";
import { MISC_COMMANDS } from "./defs/misc.js";

/**
 * All commands registered in the system with their metadata.
 * This is the Source of Truth for Registry, Help, and Autocomplete.
 */
export const COMMAND_MANIFEST = {
    ...AUDIT_COMMANDS,
    ...SECURITY_COMMANDS,
    ...DNS_COMMANDS,
    ...EMAIL_COMMANDS,
    ...WEB_COMMANDS,
    ...PERF_COMMANDS,
    ...NETWORK_COMMANDS,
    ...UTIL_COMMANDS,
    ...EMULATION_COMMANDS,
    ...MISC_COMMANDS
};

/**
 * Get commands grouped by category for Help UI rendering.
 */
export function getCommandsByCategory() {
    const categories = {};
    Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
        if (!categories[def.category]) {
            categories[def.category] = [];
        }
        categories[def.category].push({ name, ...def });
    });
    return categories;
}
