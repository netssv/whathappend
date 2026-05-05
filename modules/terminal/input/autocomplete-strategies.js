/**
 * @module modules/terminal/input/autocomplete-strategies.js
 * @description Individual tab-completion strategies for the autocomplete engine.
 *
 * Each strategy receives parsed input context and returns true if it handled
 * the completion, false otherwise (chain-of-responsibility pattern).
 *
 * @connections
 * - Imports: InputEvents, ContextManager, autocomplete-data
 * - Exports: Strategy functions + resolveMatches helper
 * - Layer: Terminal Layer (Input)
 */

import { InputEvents } from "./events.js";
import { ContextManager } from "../../context.js";
import {
    AVAILABLE_COMMANDS, DOMAIN_COMMANDS,
    RAW_SNIPPETS, SUBCOMMAND_MAP
} from "../../data/autocomplete-data.js";

// ── Constants ────────────────────────────────────────────────────────────────

const CHAIN_FLAGS = [
    "-go", "-vitals", "-cwv", "-ip", "-myip", "-whois",
    "-registrar", "-hosting", "-ssl", "-cert", "-headers",
    "-stack", "-wappalyzer"
];

export const CONFIG_VALUE_MAP = {
    theme: ["wh_ui", "wh_dark", "amber", "classic"],
};

const CONFIG_ALIASES = ["config", "settings", "set", "prefs"];
const DOMAIN_REGEX  = /^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}$/i;

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Longest common prefix of an array of strings. */
function longestPrefix(words) {
    if (!words.length) return "";
    let p = words[0];
    for (let i = 1; i < words.length; i++) {
        while (words[i].indexOf(p) !== 0) {
            p = p.slice(0, -1);
            if (!p) return "";
        }
    }
    return p;
}

/** Extract unique hostnames from all open browser tabs. */
export function getOpenDomains() {
    return new Promise(resolve => {
        chrome.tabs.query({}, tabs => {
            const domains = new Set();
            (tabs || []).forEach(tab => {
                if (tab.url?.startsWith("http")) {
                    try { domains.add(new URL(tab.url).hostname.replace(/^www\./, "")); } catch {}
                }
            });
            resolve(domains);
        });
    });
}

/**
 * Resolve a list of matches: single → emit exact, multiple → try common prefix,
 * ambiguous → start tab-cycle. Returns true if something was emitted.
 */
export function resolveMatches(matches, partial, buildFn, cycleState) {
    if (!matches.length) return false;

    if (matches.length === 1) {
        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, buildFn(matches[0]));
        return true;
    }

    const prefix = longestPrefix(matches);
    if (prefix.length > partial.length) {
        InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, buildFn(prefix, true));
        return true;
    }

    // Multiple ambiguous → start tab-cycle
    cycleState.matches = matches.map(m => buildFn(m));
    cycleState.index = 0;
    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, cycleState.matches[0]);
    return true;
}

// ── Strategies ───────────────────────────────────────────────────────────────

/** 1. Auto-fill active domain for domain-aware commands. */
export function tryDomainFill(parts, hasTrailingSpace, commandMatches) {
    if (parts.length !== 1) return false;
    const canFill = DOMAIN_COMMANDS.includes(parts[0].toLowerCase())
        && (hasTrailingSpace || commandMatches.length === 1);
    if (!canFill) return false;

    const domain = ContextManager.getDomain();
    if (!domain) return false;
    InputEvents.emit(InputEvents.EV_BUFFER_CHANGE, `${parts[0]} ${domain} `);
    return true;
}

/** 2. Domain flag completion (e.g. google.com -vitals). */
export function tryDomainFlags(parts, hasTrailingSpace, cs) {
    if (!DOMAIN_REGEX.test(parts[0]) || parts.length > 2) return false;
    const partial = parts.length === 2 ? parts[1].toLowerCase() : (hasTrailingSpace ? "-" : "");
    if (!partial.startsWith("-")) return false;

    const matches = CHAIN_FLAGS.filter(f => f.startsWith(partial));
    return resolveMatches(matches, partial, (m, isP) =>
        isP ? `${parts[0]} ${m}` : `${parts[0]} ${m} `, cs);
}

/** 3. Subcommand completion (e.g. config timeout, geo london). */
export function trySubcommand(parts, baseCmd, cs) {
    if (parts.length > 2 || !SUBCOMMAND_MAP[baseCmd]) return false;
    const partial = parts.length === 2 ? parts[1].toLowerCase() : "";
    const matches = SUBCOMMAND_MAP[baseCmd].filter(k => k.startsWith(partial));
    return resolveMatches(matches, partial, (m, isP) =>
        isP ? `${baseCmd} ${m}` : `${baseCmd} ${m} `, cs);
}

/** 4. Config value completion (e.g. config theme wh_ui). */
export function tryConfigValue(parts, baseCmd, hasTrailingSpace, cs) {
    if (!CONFIG_ALIASES.includes(baseCmd) || parts.length !== 3 || hasTrailingSpace) return false;
    const sub = parts[1].toLowerCase();
    const opts = CONFIG_VALUE_MAP[sub];
    if (!opts) return false;
    const partial = parts[2].toLowerCase();
    const matches = opts.filter(v => v.startsWith(partial));
    return resolveMatches(matches, partial, (m, isP) =>
        isP ? `${baseCmd} ${sub} ${m}` : `${baseCmd} ${sub} ${m} `, cs);
}

/** 5. Active-tab domain completion for domain commands. */
export async function tryTabDomains(parts, baseCmd, hasTrailingSpace, cs) {
    if (parts.length !== 2 || hasTrailingSpace || !DOMAIN_COMMANDS.includes(baseCmd)) return false;
    const partial = parts[1].toLowerCase();
    const domains = await getOpenDomains();
    const matches = Array.from(domains).filter(d => d.startsWith(partial));
    return resolveMatches(matches, partial, (m, isP) =>
        isP ? `${parts[0]} ${m}` : `${parts[0]} ${m} `, cs);
}

/** 6. Bash snippet completion. */
export function trySnippet(input, cs) {
    if (!input.includes(" ") && !input.includes("-")) return false;
    const matches = RAW_SNIPPETS.filter(s => s.toLowerCase().startsWith(input.toLowerCase()));
    return resolveMatches(matches, input, m => m, cs);
}

/** 7. General command + open-domain prefix completion. */
export async function tryCommandCompletion(input, cs) {
    const matches = AVAILABLE_COMMANDS.filter(c => c.startsWith(input.toLowerCase()));
    const domains = await getOpenDomains();
    const active = ContextManager.getDomain();
    if (active) domains.add(active);
    domains.forEach(d => {
        if (d.toLowerCase().startsWith(input.toLowerCase()) && !matches.includes(d)) matches.push(d);
    });
    return resolveMatches(matches, input, (m, isP) => isP ? m : `${m} `, cs);
}
