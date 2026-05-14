/**
 * @module modules/data/autocomplete-data.js
 * @description Dynamic autocomplete datasets derived from the Command Manifest.
 */

import { COMMAND_MANIFEST } from "./command-manifest.js";
import { COMMAND_NAMES } from "./command-names.js";

// 1. Build AVAILABLE_COMMANDS (Base commands + Aliases)
export const AVAILABLE_COMMANDS = COMMAND_NAMES;

const domainCommandsSet = new Set();
const subcommandMap = {};

Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
    // Auto-detect commands that accept domains
    if (def.params && def.params.includes("domain")) {
        domainCommandsSet.add(name);
        if (def.aliases) def.aliases.forEach(a => { if(!a.includes(" ")) domainCommandsSet.add(a); });
    }

    // Auto-build subcommand mapping
    if (def.subcommands) {
        subcommandMap[name] = def.subcommands;
        if (def.aliases) def.aliases.forEach(a => { if(!a.includes(" ")) subcommandMap[a] = def.subcommands; });
    }
});

export const DOMAIN_COMMANDS = Array.from(domainCommandsSet);
export const SUBCOMMAND_MAP = subcommandMap;

// Build ALIAS_MAP from manifest to replace hardcoded aliases.js
const aliasMap = {};
Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
    if (def.aliases) {
        def.aliases.forEach(a => {
            aliasMap[a] = name;
        });
    }
});
export const ALIAS_MAP = aliasMap;

// Raw Bash Educational Snippets (Still static as they are external examples)
export const RAW_SNIPPETS = [
    "curl -I -s https://",
    "curl -w \"\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n\" -o /dev/null -s https://",
    "curl -s https://api.thegreenwebfoundation.org/greencheck/",
    "curl -s \"https://crt.sh/?q=",
    "curl -o /dev/null https://speed.cloudflare.com/__down?bytes=10485760",
    "ping -c 10 ",
    "whois ",
    "dig ",
    "nc -z -v -w2 "
];

// Global config keys (Still static as they apply to the core 'config' command)
export const CONFIG_KEYS = ["timeout", "retry-timeout", "auto-triage", "tab-notify", "autoHide", "autoHideDelay", "expert-mode", "theme", "reset", "list"];
