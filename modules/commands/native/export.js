import {ANSI, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { getHistory, getNotes } from "../../state.js";

// ===================================================================
//  export — Export terminal history to JSON or CSV
// ===================================================================

export async function cmdExport(args) {
    const format = (args[0] || "json").toLowerCase();
    if (format !== "json" && format !== "csv") {
        return cmdUsage("export", "[json|csv]${ANSI.reset}\n${ANSI.dim}Default: json");
    }

    const history = getHistory();

    if (history.length === 0) {
        return `${ANSI.yellow}No commands in history to export.${ANSI.reset}\n${ANSI.dim}Run some commands first, then try again.${ANSI.reset}`;
    }

    const resp = await chrome.runtime.sendMessage({
        command: "export-history",
        payload: { history, format, notes: getNotes() },
    });

    if (!resp) return workerError();
    if (resp.error) return cmdError(`Export failed: ${resp.error}`);

    if (resp.data?.dataUrl) {
        try {
            const a = document.createElement("a");
            a.href = resp.data.dataUrl;
            a.download = resp.data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (_) {
            return cmdError("Download trigger failed.");
        }
    }

    return `${ANSI.green}✓ Exported ${history.length} entries to ${resp.data?.filename || "report"}${ANSI.reset}\n${ANSI.dim}Format: ${format.toUpperCase()} | Size: ${resp.data?.size || 0} bytes${ANSI.reset}`;
}
