import { ANSI } from "../../formatter.js";

// ===================================================================
//  config — User preferences via chrome.storage.local
//
//  Syntax:
//    config                    → Show all current settings
//    config <key>              → Show value for a specific key
//    config <key> <value>      → Set a key-value pair
//    config reset              → Reset all settings to defaults
//
//  Schema: All keys and validation rules are defined in CONFIG_SCHEMA.
//  Security: Timeout values are numeric-only, capped at 10s (10000ms).
// ===================================================================

const CONFIG_SCHEMA = {
    timeout: {
        default: 3500,
        type: "number",
        min: 500,
        max: 10000,
        unit: "ms",
        desc: "Network request timeout",
    },
    "retry-timeout": {
        default: 8000,
        type: "number",
        min: 1000,
        max: 10000,
        unit: "ms",
        desc: "Background header retry timeout",
    },
    "auto-triage": {
        default: true,
        type: "boolean",
        desc: "Auto-analyze on panel open",
    },
    "tab-notify": {
        default: true,
        type: "boolean",
        desc: "Show tab-switch notification bar",
    },
    "expert-mode": {
        default: false,
        type: "boolean",
        desc: "Show raw technical data in diagnostics",
    },
};

const STORAGE_KEY = "wh_config";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function loadConfig() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        return data[STORAGE_KEY] || {};
    } catch (_) {
        return {};
    }
}

async function saveConfig(config) {
    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: config });
    } catch (_) {}
}

function resolveValue(key, stored) {
    const schema = CONFIG_SCHEMA[key];
    if (!schema) return undefined;
    return stored[key] !== undefined ? stored[key] : schema.default;
}

function validateAndParse(key, rawValue) {
    const schema = CONFIG_SCHEMA[key];
    if (!schema) return { error: `Unknown config key: '${key}'` };

    if (schema.type === "number") {
        const num = Number(rawValue);
        if (isNaN(num) || !Number.isFinite(num)) {
            return { error: `'${key}' must be a number. Got: '${rawValue}'` };
        }
        if (num < schema.min || num > schema.max) {
            return { error: `'${key}' must be between ${schema.min}–${schema.max}${schema.unit || ""}. Got: ${num}` };
        }
        return { value: Math.round(num) };
    }

    if (schema.type === "boolean") {
        const lower = String(rawValue).toLowerCase();
        if (["true", "1", "on", "yes"].includes(lower)) return { value: true };
        if (["false", "0", "off", "no"].includes(lower)) return { value: false };
        return { error: `'${key}' must be true/false. Got: '${rawValue}'` };
    }

    return { value: rawValue };
}

// ---------------------------------------------------------------------------
// Public command handler
// ---------------------------------------------------------------------------

export async function cmdConfig(args) {
    // config reset — restore defaults
    if (args[0] === "reset") {
        await saveConfig({});
        return `${ANSI.green}✓ All settings reset to defaults.${ANSI.reset}`;
    }

    const stored = await loadConfig();

    // config (no args) or config list — show all settings
    if (args.length === 0 || args[0] === "list") {
        let out = `\n${ANSI.white}${ANSI.bold}  Configuration${ANSI.reset}\n`;
        out += `  ${ANSI.dim}${"━".repeat(42)}${ANSI.reset}\n`;

        for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
            const val = resolveValue(key, stored);
            const isCustom = stored[key] !== undefined;
            const valColor = isCustom ? ANSI.yellow : ANSI.green;
            const tag = isCustom ? ` ${ANSI.dim}[custom]${ANSI.reset}` : "";
            const unit = schema.unit || "";
            out += `  ${ANSI.cyan}${key}${ANSI.reset}`;
            out += " ".repeat(Math.max(1, 18 - key.length));
            out += `${valColor}${val}${unit}${ANSI.reset}${tag}\n`;
            out += `  ${" ".repeat(18)}${ANSI.dim}${schema.desc}${ANSI.reset}\n`;
        }

        out += `\n${ANSI.dim}  Usage: config <key> <value>${ANSI.reset}\n`;
        out += `${ANSI.dim}  Reset: config reset${ANSI.reset}\n`;
        return out;
    }

    const key = args[0].toLowerCase();

    // config <key> — show single value
    if (args.length === 1) {
        if (!CONFIG_SCHEMA[key]) {
            const available = Object.keys(CONFIG_SCHEMA).join(", ");
            return `${ANSI.red}Unknown key: '${key}'${ANSI.reset}\n${ANSI.dim}Available: ${available}${ANSI.reset}`;
        }
        const val = resolveValue(key, stored);
        const schema = CONFIG_SCHEMA[key];
        const unit = schema.unit || "";
        return `${ANSI.cyan}${key}${ANSI.reset} = ${ANSI.yellow}${val}${unit}${ANSI.reset} ${ANSI.dim}(${schema.desc})${ANSI.reset}`;
    }

    // config <key> <value> — set value
    const rawValue = args.slice(1).join(" ");
    const result = validateAndParse(key, rawValue);

    if (result.error) {
        return `${ANSI.red}[VALIDATION] ${result.error}${ANSI.reset}`;
    }

    stored[key] = result.value;
    await saveConfig(stored);

    const schema = CONFIG_SCHEMA[key];
    const unit = schema.unit || "";
    return `${ANSI.green}✓${ANSI.reset} ${ANSI.cyan}${key}${ANSI.reset} set to ${ANSI.yellow}${result.value}${unit}${ANSI.reset}`;
}

// ---------------------------------------------------------------------------
// Config Reader — used by other modules to read settings at runtime
// ---------------------------------------------------------------------------

export async function getConfig(key) {
    const stored = await loadConfig();
    return resolveValue(key, stored);
}
