/**
 * @module modules/data/autocomplete-data.js
 * @description Dynamic autocomplete datasets derived from the Command Manifest.
 */

import { COMMAND_MANIFEST } from "./command-manifest.js";

// 1. Build AVAILABLE_COMMANDS (Base commands + Aliases)
const commandSet = new Set();
const domainCommandsSet = new Set();
const subcommandMap = {};

Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
    commandSet.add(name);
    
    // Add aliases to autocomplete
    if (def.aliases) {
        def.aliases.forEach(alias => {
            // Only add single-word aliases to global autocomplete
            if (!alias.includes(" ")) {
                commandSet.add(alias);
            }
        });
    }

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

export const AVAILABLE_COMMANDS = Array.from(commandSet);
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
