import { cancelAbort } from "./abort.js";
import { getActiveDomain } from "./tab-tracker.js";
import { handleDNS } from "./handlers/dns.js";
import { handleHTTPHeaders, handleFetchText } from "./handlers/http.js";
import { handleSSL } from "./handlers/ssl.js";
import { handleWHOIS } from "./handlers/whois.js";
import { handlePing } from "./handlers/ping.js";
import { handleRedirectTrace } from "./handlers/trace.js";
import { handleGetPageHTML } from "./handlers/dom.js";
import { handlePortProbe } from "./handlers/port.js";
import { handleExportHistory } from "./handlers/export.js";

// ===================================================================
// Message Router
// ===================================================================

export function setupRouter() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        const { command, payload } = message;

        // Abort command — triggered by Ctrl+C
        if (command === "abort") {
            const abortId = payload?.abortId;
            if (abortId) cancelAbort(abortId);
            sendResponse({ ok: true });
            return false;
        }

        switch (command) {
            case "dns":
                handleDNS(payload).then(sendResponse);
                break;
            case "http-headers":
                handleHTTPHeaders(payload).then(sendResponse);
                break;
            case "ssl":
                handleSSL(payload).then(sendResponse);
                break;
            case "whois":
                handleWHOIS(payload).then(sendResponse);
                break;
            case "ping":
                handlePing(payload).then(sendResponse);
                break;
            case "redirect-trace":
                handleRedirectTrace(payload).then(sendResponse);
                break;
            case "fetch-text":
                handleFetchText(payload).then(sendResponse);
                break;
            case "get-page-html":
                handleGetPageHTML(payload).then(sendResponse);
                break;
            case "get-active-domain":
                getActiveDomain().then(sendResponse);
                break;

            // ── Browser-based network tools ──
            case "port-probe":
                handlePortProbe(payload).then(sendResponse);
                break;

            // ── Export ──
            case "export-history":
                handleExportHistory(payload).then(sendResponse);
                break;

            default:
                sendResponse({ error: `Unknown command: ${command}` });
                return false;
        }

        return true;
    });
}
