/**
 * @module modules/core/registry.js
 * @description Centralized command registry. Derived from the Command Manifest.
 */

import { COMMAND_MANIFEST } from "../data/command-manifest.js";

/**
 * Maps command names to their execution functions.
 * Built dynamically from the Command Manifest to ensure a single Source of Truth.
 */
const registry = {};

Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
    registry[name] = def.exec;
    
    // Register aliases as well
    if (def.aliases) {
        def.aliases.forEach(alias => {
            // Only register as alias if it's not a complex help flag
            if (!alias.includes(" ")) {
                registry[alias] = def.exec;
            }
        });
    }
});

export const COMMAND_REGISTRY = registry;
