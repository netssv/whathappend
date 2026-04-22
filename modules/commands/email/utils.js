// ---------------------------------------------------------------------------
// DKIM Utils
// ---------------------------------------------------------------------------

// Helper: normalize TXT record data from Google DoH
// Strips escaped quotes, backslashes, and trims whitespace
export function normTxt(r) {
    return (r.data || "").replace(/\\"|\\|"/g, "").trim();
}
