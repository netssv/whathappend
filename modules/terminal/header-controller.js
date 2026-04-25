// ===================================================================
// Header Controller — Barrel re-export
//
// Delegates to focused sub-modules:
//   header-domain.js    — Click-to-edit domain input
//   header-triad.js     — REG / NS / HOST badges + retry
//   header-tab-switch.js — Tab-switch notification bar
// ===================================================================

export { initDomainInput as initHeaderController, isHeaderFocused } from "./header/header-domain.js";
export { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable, clearWhoisFields } from "./header/header-triad.js";
export { showTabSwitch, hideTabSwitch } from "./header/header-tab-switch.js";
