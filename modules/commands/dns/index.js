/**
 * @module modules/commands/dns/index.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: cmdDig, digInsights, cmdHost, cmdNslookup, cmdTTL, fmtTTL, cmdDnssec
 * - Layer: Command Layer (DNS) - Executes DNS resolution and formatting.
 */

export { cmdDig, digInsights } from "./dig.js";
export { cmdHost } from "./host.js";
export { cmdNslookup } from "./nslookup.js";
export { cmdTTL, fmtTTL } from "./ttl.js";
export { cmdDnssec } from "./dnssec.js";
