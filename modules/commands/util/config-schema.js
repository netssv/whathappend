/**
 * @module modules/commands/util/config-schema.js
 * @description Configuration schema, validation rules, and storage bindings.
 */

import { THEMES, DEFAULT_THEME_ID } from "../../data/themes.js";

export const STORAGE_KEY = "wh_config";

export const CONFIG_SCHEMA = {
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
    "autoHide": {
        default: true,
        type: "boolean",
        desc: "Auto-hide header panels when data loaded",
    },
    "autoHideBlocker": {
        default: true,
        type: "boolean",
        desc: "Auto-hide content blocker button and panel",
    },
    "autoHideDelay": {
        default: 10000,
        type: "number",
        min: 1000,
        max: 30000,
        unit: "ms",
        desc: "Delay before header auto-hides",
    },
    "expert-mode": {
        default: false,
        type: "boolean",
        desc: "Show raw technical data in diagnostics",
    },
    "theme": {
        default: DEFAULT_THEME_ID,
        type: "enum",
        options: Object.keys(THEMES),
        desc: "Visual theme (WhOS, amber, matrix)",
    },
};

export async function loadConfig() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        return data[STORAGE_KEY] || {};
    } catch (_) {
        return {};
    }
}

export async function saveConfig(config) {
    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: config });
    } catch (_) { }
}

export function resolveValue(key, stored) {
    const schema = CONFIG_SCHEMA[key];
    if (!schema) return undefined;
    return stored[key] !== undefined ? stored[key] : schema.default;
}

export function validateAndParse(key, rawValue) {
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

    if (schema.type === "enum") {
        const lower = String(rawValue).toLowerCase();
        if (schema.options.includes(lower)) return { value: lower };
        return { error: `'${key}' must be one of: ${schema.options.join(", ")}. Got: '${rawValue}'` };
    }

    return { value: rawValue };
}
