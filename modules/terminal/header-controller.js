// Header Controller — Barrel re-export
export { initDomainInput as initHeaderController, isHeaderFocused } from "./header/header-domain.js";
export { updateWhoisFields, updateNSField, updateHostField, markFieldRetryable, clearWhoisFields } from "./header/header-triad.js";
export { showTabSwitch, hideTabSwitch } from "./header/header-tab-switch.js";
export { initBlockPanel, updateBlockState } from "./header/header-block.js";
export { initLogoMenu } from "./header/header-logo-menu.js";
