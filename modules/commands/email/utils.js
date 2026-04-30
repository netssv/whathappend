/**
 * @module modules/commands/email/utils.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: None (Dependency-free)
 * - Exports: normTxt
 * - Layer: Command Layer (Email) - Audits SPF, DKIM, DMARC records.
 */

// ---------------------------------------------------------------------------
// DKIM Utils
// ---------------------------------------------------------------------------

// Helper: normalize TXT record data from Google DoH
// Strips escaped quotes, backslashes, and trims whitespace
export function normTxt(r) {
    return (r.data || "").replace(/\\"|\\|"/g, "").trim();
}
