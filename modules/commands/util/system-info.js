import { ANSI } from "../../formatter.js";
import { getHistory } from "../../state.js";

// ===================================================================
//  info — Local Telemetry and Identity
// ===================================================================

export async function cmdInfo() {
    const manifest = chrome.runtime.getManifest();
    const version = manifest.version;
    const ua = navigator.userAgent;
    const stats = getHistory().length;
    
    let publicIp = "Offline";
    try {
        const ipResp = await fetch("https://1.1.1.1/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
        const text = await ipResp.text();
        const match = text.match(/ip=([^\n]+)/);
        if (match) publicIp = match[1];
    } catch (e) {}

    let storageUsed = "Unknown";
    try {
        const bytes = await chrome.storage.local.getBytesInUse(null);
        storageUsed = (bytes / 1024).toFixed(2) + " KB";
    } catch (e) {}

    const ram = navigator.deviceMemory ? navigator.deviceMemory + "GB" : "Unknown";
    const cores = navigator.hardwareConcurrency || "Unknown";

    let nativeHostStatus = `${ANSI.red}Disconnected (Browser Sandbox Mode)${ANSI.reset}`;
    
    try {
        // Attempt to check native host status via a lightweight ping
        // A timeout of 2 seconds prevents hanging if the background script is stuck
        const pingPromise = chrome.runtime.sendMessage({ command: "ping-native" });
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ error: "timeout" }), 2000));
        
        const resp = await Promise.race([pingPromise, timeoutPromise]);
        
        // If the background script returns an explicit error about native host, it's disconnected
        // If we get any response without a specific "native host not found" error, consider it connected
        if (resp && !resp.error) {
            nativeHostStatus = `${ANSI.green}Connected (Python Bridge Active)${ANSI.reset}`;
        } else if (resp && resp.error !== "timeout" && !resp.error.includes("native messaging")) {
            // Some generic error but it reached the background
            nativeHostStatus = `${ANSI.green}Connected (Python Bridge Active)${ANSI.reset}`;
        }
    } catch (e) {
        // Extension background context error (e.g. extension reloaded)
    }

    let tabCount = "Unknown";
    try {
        const tabs = await chrome.tabs.query({});
        tabCount = tabs.length;
    } catch (e) {}

    let memoryUsed = "Unknown";
    if (performance && performance.memory) {
        memoryUsed = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + " MB (JS Heap)";
    }

    let connectionInfo = "Unknown";
    if (navigator.connection) {
        let type = navigator.connection.type ? navigator.connection.type.toUpperCase() : "BROADBAND";
        if (type === "UNKNOWN") type = "BROADBAND";
        connectionInfo = `${type} (~${navigator.connection.downlink} Mbps, ${navigator.connection.rtt}ms RTT)`;
    }

    const extId = chrome.runtime.id;

    return `
> info (System Diagnostics)

  ${ANSI.dim}Manifest Version:${ANSI.reset} v${version}
  ${ANSI.dim}Extension ID:${ANSI.reset}     ${extId}
  ${ANSI.dim}Public IP:${ANSI.reset}        ${ANSI.cyan}${publicIp}${ANSI.reset}
  ${ANSI.dim}Network Link:${ANSI.reset}     ${connectionInfo}
  ${ANSI.dim}Native Host:${ANSI.reset}      ${nativeHostStatus}
  ${ANSI.dim}Storage Cache:${ANSI.reset}    ${storageUsed}
  ${ANSI.dim}Memory Usage:${ANSI.reset}     ${memoryUsed}
  ${ANSI.dim}Open Tabs:${ANSI.reset}        ${tabCount}
  ${ANSI.dim}Hardware:${ANSI.reset}         ${cores} Cores / ~${ram} RAM
  ${ANSI.dim}Browser Engine:${ANSI.reset}   ${ua}
  ${ANSI.dim}Session Stats:${ANSI.reset}    ${stats} commands executed

${ANSI.dim}WhatHappened is an Open Source Infrastructure Terminal.${ANSI.reset}
${ANSI.dim}All telemetry is strictly local. No data leaves your machine.${ANSI.reset}
`;
}
