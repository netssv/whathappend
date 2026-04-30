/**
 * @module modules/terminal/header-controller.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: initDomainInput, isHeaderFocused, updateWhoisFields, updateNSField, updateHostField, markFieldRetryable, clearWhoisFields, showTabSwitch, hideTabSwitch, initBlockPanel, updateBlockState, initLogoMenu
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

// Header Controller — Barrel re-export
export { initDomainInput as initHeaderController, isHeaderFocused } from "./header/header-domain.js";
export { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable, clearWhoisFields } from "./header/header-triad.js";
export { showTabSwitch, hideTabSwitch } from "./header/header-tab-switch.js";
export { initBlockPanel, updateBlockState } from "./header/header-block.js";
export { initLogoMenu } from "./header/header-logo-menu.js";
