/**
 * @module modules/data/help-data.js
 * @description Dynamic help sections derived from the Command Manifest.
 */

import { COMMAND_MANIFEST } from "./command-manifest.js";

// Desired order of categories in the Help UI
const CATEGORY_ORDER = [
    "AUDIT SUITE",
    "SECURITY",
    "DNS",
    "EMAIL",
    "WEB CORE",
    "PERF & UI",
    "NETWORK",
    "EXTERNAL",
    "SESSION & TABS",
    "SYSTEM & UTILS",
    "EMULATION & DEBUGGING",
    "FUN & EGGS"
];

/**
 * Builds the HELP_SECTIONS array used by the Help UI.
 */
function buildHelpSections() {
    const sectionsMap = {};
    
    Object.entries(COMMAND_MANIFEST).forEach(([name, def]) => {
        if (!sectionsMap[def.category]) {
            sectionsMap[def.category] = { cmds: [], key: def.key };
        }
        
        // Format aliases for display
        const displayAliases = def.aliases ? def.aliases.join(" ") : "";
        
        sectionsMap[def.category].cmds.push([name, def.desc, displayAliases]);
    });

    return CATEGORY_ORDER.map(title => ({
        title,
        key: sectionsMap[title]?.key,
        cmds: sectionsMap[title]?.cmds || []
    })).filter(section => section.cmds.length > 0);
}

export const HELP_SECTIONS = buildHelpSections();
