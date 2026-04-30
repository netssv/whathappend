/**
 * @module modules/commands/email/index.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: cmdEmail, cmdSPF, cmdDMARC, cmdDKIM
 * - Layer: Command Layer (Email) - Audits SPF, DKIM, DMARC records.
 */

export { cmdEmail } from "./email.js";
export { cmdSPF } from "./spf.js";
export { cmdDMARC } from "./dmarc.js";
export { cmdDKIM } from "./dkim.js";
