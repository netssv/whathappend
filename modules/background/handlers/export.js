// ===================================================================
// Export History Handler
// ===================================================================

export async function handleExportHistory({ history, format }) {
    try {
        let content, mimeType, filename;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

        if (format === "csv") {
            const rows = [["timestamp", "command", "output"]];
            for (const entry of history) {
                const cleanOutput = (entry.output || "")
                    .replace(/\x1b\[[0-9;]*m/g, "")
                    .replace(/"/g, '""');
                rows.push([
                    entry.timestamp || "",
                    `"${entry.command || ""}"`,
                    `"${cleanOutput}"`,
                ]);
            }
            content = rows.map(r => r.join(",")).join("\n");
            mimeType = "text/csv";
            filename = `whathappened-report-${timestamp}.csv`;
        } else {
            const cleaned = history.map(entry => ({
                timestamp: entry.timestamp || new Date().toISOString(),
                command: entry.command || "",
                output: (entry.output || "").replace(/\x1b\[[0-9;]*m/g, ""),
            }));
            content = JSON.stringify({
                tool: "WhatHappened",
                version: "2.0.0",
                exported: new Date().toISOString(),
                entries: cleaned,
            }, null, 2);
            mimeType = "application/json";
            filename = `whathappened-report-${timestamp}.json`;
        }

        const blob = new Blob([content], { type: mimeType });
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.onloadend = () => {
                resolve({
                    success: true,
                    data: {
                        dataUrl: reader.result,
                        filename,
                        size: content.length,
                    },
                });
            };
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        return { error: `Export failed: ${err.message}` };
    }
}
