/**
 * @module modules/utils.js
 * @description Barrel re-export — maintains backwards compatibility for all existing imports.
 *              Logic has been split into focused modules:
 *                - utils-domain.js  → domain/URL/IP helpers
 *                - utils-tui.js     → TUI rendering & hitbox detection
 *
 * @connections
 * - Re-exports: everything from utils-domain.js and utils-tui.js
 * - Layer: Shared Utility — stable public surface, internal logic is modular.
 */

export {
    stripANSI,
    isRdapMaintainer,
    ensureProtocol,
    daysUntil,
    extractDomain,
    resolveProvider,
    getProviderFromCNAME,
} from "./utils-domain.js";

export {
    wrapAnsiText,
    buildPageDots,
    renderMenuBlock,
    getMenuActionAt,
} from "./utils-tui.js";
