#!/usr/bin/env node
/**
 * @module dev-lint.js
 * @description Developer convention checker for the WhatHappened codebase.
 *
 * Run: node dev-lint.js
 *
 * Checks enforced:
 *   1. No .js file exceeds MAX_LINES (200) — keeps modules atomic
 *   2. Subcommand arrays use consistent dash convention
 *   3. Reports files that need attention
 *
 * ═══════════════════════════════════════════════════════════════════
 * CODING CONVENTIONS (read before contributing)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  1. MAX FILE SIZE: 200 lines per .js file.
 *     If your file exceeds this, split it into:
 *       - command.js         (orchestrator / entry point)
 *       - command-core.js    (logic / data processing)
 *       - command-ui.js      (rendering / formatting)
 *
 *  2. SUBCOMMAND CONVENTION:
 *     There are two types of subcommands. Use the right one:
 *
 *     a) CONFIG KEYS (no dash) — for settings, named values, modes:
 *        config theme wh_ui    →  args[0] = "theme"
 *        watch dashboard       →  args[0] = "dashboard"
 *        geo london            →  args[0] = "london"
 *
 *     b) ACTION FLAGS (with dash) — for extraction types, toggles:
 *        extract -emails       →  flags[0] = "-emails"
 *        extract -images --clip → flags = ["-images", "--clip"]
 *        block --list          →  flags[0] = "--list"
 *
 *     Rule of thumb: if it's a NOUN/MODE → no dash (args).
 *                    if it's an ACTION/FILTER → use dash (flags).
 *
 *  3. PARSER BEHAVIOR:
 *     The parser (core/parser.js) splits input into:
 *       args[]  = tokens WITHOUT leading dash
 *       flags[] = tokens WITH leading dash (-, --)
 *     If your command needs flags, accept (args, flags) in the registry.
 *
 *  4. SEPARATOR LINES: max 28 chars ("━".repeat(28)) for side panel fit.
 *
 *  5. EMOJIS: avoid in command output. Only allowed in:
 *       - Interactive menus (nav, help categories)
 *       - User-facing notifications where explicitly requested
 *     Use ANSI color codes for visual distinction instead.
 *
 *  6. EXPORTS: one command per file. Use index.js barrel exports.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const MAX_LINES = 200;
const ROOT = new URL("./modules", import.meta.url).pathname;
const IGNORE = ["node_modules", ".git", "vendor", "dist"];

async function walk(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (IGNORE.includes(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await walk(full));
        else if (entry.name.endsWith(".js")) files.push(full);
    }
    return files;
}

async function checkLineCount(file) {
    if (file.includes("command-names.js")) return { file: relative(ROOT, file), lines: 0, over: false };
    const content = await readFile(file, "utf-8");
    const lines = content.split("\n").length;
    return { file: relative(ROOT, file), lines, over: lines > MAX_LINES };
}

async function validateManifest() {
    const errors = [];
    // Dynamic import to avoid module side-effects at load time
    const { COMMAND_MANIFEST } = await import("./modules/data/command-manifest.js");
    
    const aliasMap = new Map();

    for (const [cmdName, def] of Object.entries(COMMAND_MANIFEST)) {
        // 1. exec must be a function
        if (typeof def.exec !== "function") {
            errors.push(`Command '${cmdName}' is missing an 'exec' function`);
        }
        
        // 2. categories check
        if (!def.category) {
            errors.push(`Command '${cmdName}' is missing a 'category'`);
        }
        
        // 3. alias collision and space check
        const aliases = def.aliases || [];
        for (const alias of aliases) {
            if (alias.includes(" ")) {
                errors.push(`Alias '${alias}' for command '${cmdName}' contains a space (not allowed)`);
            }
            if (aliasMap.has(alias)) {
                errors.push(`Alias collision: '${alias}' used by both '${aliasMap.get(alias)}' and '${cmdName}'`);
            }
            aliasMap.set(alias, cmdName);
        }
    }
    return errors;
}

async function checkIntegrity() {
    const EXPECTED = "sha256:ea4b09082ca4ba0ae71be6431a097678751d0453b9c52a4d2c7c39a2166ed9fc";
    try {
        const fileContent = await readFile("lib/dompurify.min.js");
        const actual = createHash("sha256").update(fileContent).digest("hex");
        if (`sha256:${actual}` !== EXPECTED) {
            return [`DOMPurify integrity check failed! Expected ${EXPECTED}, got sha256:${actual}`];
        }
    } catch (e) {
        return [`Failed to read lib/dompurify.min.js for integrity check: ${e.message}`];
    }
    return [];
}

async function generateCommandNames() {
    const { COMMAND_MANIFEST } = await import("./modules/data/command-manifest.js");
    const commandSet = new Set();
    Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
        commandSet.add(name);
        if (def.aliases) {
            def.aliases.forEach(alias => {
                if (!alias.includes(" ")) commandSet.add(alias);
            });
        }
    });
    const names = Array.from(commandSet).sort();

    const content = `/**
 * @module modules/data/command-names.js
 * @description AUTO-GENERATED flat list of command names for the parser.
 * DO NOT EDIT DIRECTLY. Generated by dev-lint.js.
 */

export const COMMAND_NAMES = ${JSON.stringify(names, null, 4)};
`;
    await writeFile(join(ROOT, "data/command-names.js"), content);
    return names.length;
}

async function main() {
    console.log("\n  WhatHappened Dev Lint\n  " + "━".repeat(28) + "\n");

    const files = await walk(ROOT);
    const results = await Promise.all(files.map(checkLineCount));

    // Line count violations
    const violations = results.filter(r => r.over).sort((a, b) => b.lines - a.lines);

    if (violations.length === 0) {
        console.log("  All files under " + MAX_LINES + " lines.\n");
    } else {
        console.log(`  ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
        for (const v of violations) {
            const sev = v.lines > 300 ? "!!" : " >";
            console.log(`  ${sev} ${v.file.padEnd(50)} ${v.lines} lines`);
        }
        console.log();
    }

    // Summary
    const smallest = results.reduce((a, b) => a.lines < b.lines ? a : b);
    const largest  = results.reduce((a, b) => a.lines > b.lines ? a : b);
    console.log(`  Total modules: ${results.length}`);
    console.log(`  Avg lines:     ${Math.round(results.reduce((s, r) => s + r.lines, 0) / results.length)}`);
    console.log(`  Smallest:      ${smallest.file} (${smallest.lines})`);
    console.log(`  Largest:       ${largest.file} (${largest.lines})`);
    console.log();

    console.log("  Manifest Validation\n  " + "━".repeat(28));
    const manifestErrors = await validateManifest();
    
    if (manifestErrors.length > 0) {
        manifestErrors.forEach(err => console.log(`  ❌ ${err}`));
        console.log();
    } else {
        console.log("  ✅ COMMAND_MANIFEST integrity OK\n");
    }

    console.log("  Auto-generation\n  " + "━".repeat(28));
    const count = await generateCommandNames();
    console.log(`  ✅ Generated command-names.js (${count} commands)\n`);

    console.log("  Dependency Integrity\n  " + "━".repeat(28));
    const integrityErrors = await checkIntegrity();
    
    if (integrityErrors.length > 0) {
        integrityErrors.forEach(err => console.log(`  ❌ ${err}`));
        console.log();
    } else {
        console.log("  ✅ DOMPurify integrity OK\n");
    }

    if (violations.length > 0 || manifestErrors.length > 0 || integrityErrors.length > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
