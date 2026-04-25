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

    return `
> info (System Diagnostics)

  ${ANSI.dim}Manifest Version:${ANSI.reset} v${version}
  ${ANSI.dim}Native Host:${ANSI.reset}      ${nativeHostStatus}
  ${ANSI.dim}Browser Engine:${ANSI.reset}   ${ua}
  ${ANSI.dim}Session Stats:${ANSI.reset}    ${stats} resources scanned this session

${ANSI.dim}All telemetry is strictly local. No data leaves your machine.${ANSI.reset}
`;
}
