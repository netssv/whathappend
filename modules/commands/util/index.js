/**
 * @module modules/commands/util/index.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: cmdTarget, cmdHelp, cmdDetailedHelp, cmdErrors, cmdAbout, cmdInfo, cmdExit, cmdSwitch, cmdStart, cmdConfig, cmdNotes, cmdTabs
 * - Layer: Command Layer (Util) - Terminal utilities and internal tools.
 */

export { cmdTarget } from "./target.js";
export { cmdHelp } from "./help.js";
export { cmdDetailedHelp } from "./detailed-help.js";
export { cmdErrors } from "./errors.js";
export { cmdAbout } from "./about.js";
export { cmdInfo } from "./system-info.js";
export { cmdExit } from "./exit.js";
export { cmdSwitch } from "./switch.js";
export { cmdStart } from "./start.js";
export { cmdConfig } from "./config.js";
export { cmdTabs } from "./tabs.js";
export { cmdReload } from "./reload.js";
export { cmdNotes } from "./notes.js";
