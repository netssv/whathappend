/**
 * @module modules/background/router.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - cancelAbort from './abort.js'
 *     - getActiveDomain from './tab-tracker.js'
 *     - handleDNS from './handlers/dns.js'
 *     - handleHTTPHeaders, handleFetchText from './handlers/http.js'
 *     - handleSSL from './handlers/ssl.js'
 *     - handleWHOIS, handleIPWhois from './handlers/whois.js'
 *     - handlePing from './handlers/ping.js'
 *     - handleRedirectTrace from './handlers/trace.js'
 *     - handleGetPageHTML, handleDetectLivePixels, handleGetLinks from './handlers/dom.js'
 *     - handleGetPerfTiming from './handlers/perf.js'
 *     - handleGetCookies from './handlers/cookies.js'
 *     - handlePortProbe from './handlers/port.js'
 *     - handleExportHistory from './handlers/export.js'
 *     - handleIsUpLocal, handleIsUpGlobal from './handlers/isup.js'
 *     - handleSpeed from './handlers/speed.js'
 *     - handleSpeedtest from './handlers/speedtest.js'
 *     - handleGetPublicIP from './handlers/ip.js'
 *     - handleGetWebVitals from './handlers/vitals.js'
 *     - withCache from './cache.js'
 * - Exports: setupRouter
 * - Layer: Background Layer (Network & Service Worker) - Handles external HTTP/DNS requests safely.
 */

import { cancelAbort } from "./abort.js";
import { getActiveDomain, checkTabExists } from "./tab-tracker.js";
import { handleDNS } from "./handlers/dns.js";
import { handleHTTPHeaders, handleFetchText } from "./handlers/http.js";
import { handleSSL } from "./handlers/ssl.js";
import { handleWHOIS, handleIPWhois } from "./handlers/whois.js";
import { handlePing } from "./handlers/ping.js";
import { handleRedirectTrace } from "./handlers/trace.js";
import { handleGetPageHTML, handleDetectLivePixels, handleGetLinks } from "./handlers/dom.js";
import { handleGetPerfTiming } from "./handlers/perf.js";
import { handleGetCookies } from "./handlers/cookies.js";
import { handlePortProbe } from "./handlers/port.js";
import { handleExportHistory } from "./handlers/export.js";
import { handleIsUpLocal, handleIsUpGlobal } from "./handlers/isup.js";
import { handleSpeed } from "./handlers/speed.js";
import { handleSpeedtest } from "./handlers/speedtest.js";
import { handleGetPublicIP } from "./handlers/ip.js";
import { handleGetWebVitals } from "./handlers/vitals.js";
import { withCache } from "./cache.js";

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
            // Cached Commands (Ephemeral 60s LRU)
            case "dns":
                withCache(command, payload, () => handleDNS(payload)).then(sendResponse);
                break;
            case "http-headers":
                withCache(command, payload, () => handleHTTPHeaders(payload)).then(sendResponse);
                break;
            case "ssl":
                withCache(command, payload, () => handleSSL(payload)).then(sendResponse);
                break;
            case "whois":
                withCache(command, payload, () => handleWHOIS(payload)).then(sendResponse);
                break;
            case "ip-whois":
                withCache(command, payload, () => handleIPWhois(payload)).then(sendResponse);
                break;
            case "fetch-text":
                withCache(command, payload, () => handleFetchText(payload)).then(sendResponse);
                break;
            
            // Uncached Commands (Dynamic/Metrics)
            case "ping":
                handlePing(payload).then(sendResponse);
                break;
            case "redirect-trace":
                handleRedirectTrace(payload).then(sendResponse);
                break;
            case "get-page-html":
                handleGetPageHTML(payload).then(sendResponse);
                break;
            case "detect-live-pixels":
                handleDetectLivePixels().then(sendResponse);
                break;
            case "get-links":
                handleGetLinks().then(sendResponse);
                break;
            case "get-perf-timing":
                handleGetPerfTiming().then(sendResponse);
                break;
            case "get-cookies":
                handleGetCookies(payload).then(sendResponse);
                break;
            case "get-active-domain":
                getActiveDomain().then(sendResponse);
                break;
            case "check-tab-exists":
                checkTabExists(payload?.domain).then(sendResponse);
                break;

            // ── Browser-based network tools ──
            case "port-probe":
                handlePortProbe(payload).then(sendResponse);
                break;

            // ── Export ──
            case "export-history":
                handleExportHistory(payload).then(sendResponse);
                break;

            // ── Network parity ──
            case "isup-local":
                handleIsUpLocal(payload).then(sendResponse);
                break;
            case "isup-global":
                handleIsUpGlobal(payload).then(sendResponse);
                break;
            case "speed":
                handleSpeed(payload).then(sendResponse);
                break;
            case "speedtest":
                handleSpeedtest(payload || {}).then(sendResponse);
                break;
            case "get-public-ip":
                handleGetPublicIP().then(sendResponse);
                break;
            case "get-web-vitals":
                handleGetWebVitals().then(sendResponse);
                break;

            default:
                sendResponse({ error: `Unknown command: ${command}` });
                return false;
        }

        return true;
    });
}
