/**
 * @module modules/commands/util/fullscreen.js
 * @description Command to toggle Chrome window fullscreen state.
 */

import { ANSI } from "../../formatter.js";

export async function cmdFullscreen() {
    try {
        const win = await chrome.windows.getLastFocused();
        if (!win || !win.id) throw new Error("No active window found.");
        let newState;
        if (win.state === "fullscreen") {
            const data = await chrome.storage.local.get("preFullscreenState");
            newState = data.preFullscreenState || "maximized";
        } else {
            await chrome.storage.local.set({ preFullscreenState: win.state });
            newState = "fullscreen";
        }
        
        await chrome.windows.update(win.id, { state: newState });
        return `${ANSI.green}✓${ANSI.reset} Window is now ${newState}.`;
    } catch (err) {
        return `${ANSI.red}[ERROR] ${err.message}${ANSI.reset}`;
    }
}
