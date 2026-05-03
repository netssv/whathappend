/**
 * @module modules/core/triage-resolvers-mail.js
 * @description Extended triage resolvers for MY IP and MX rows.
 *
 * Uses the background `get-public-ip` handler for user IP,
 * and background DNS for MX record lookup.
 *
 * @connections
 * - Imports: updateMyIPField, updateMXField
 * - Exports: resolveMyIPRow, resolveMXRow
 * - Layer: Core Layer (Engine)
 */

import { updateMyIPField, updateMXField } from "../terminal/header-controller.js";
import { setSessionTriad } from "../state.js";

const ROW_TIMEOUT = 8000;

// ---------------------------------------------------------------------------
// MY IP — User's public IP address via background handler
// ---------------------------------------------------------------------------

export async function resolveMyIPRow(renderer) {
    try {
        const resp = await raceTimeout(
            chrome.runtime.sendMessage({ command: "get-public-ip" }),
            ROW_TIMEOUT
        );
        if (renderer?.isCancelled()) return;

        if (resp?.success && resp.data?.ip) {
            renderer?.updateRow("myip", resp.data.ip);
            updateMyIPField(resp.data.ip);
            setSessionTriad("myip", resp.data.ip);
            return { myip: resp.data.ip, error: false };
        } else {
            renderer?.updateRow("myip", null);
            return { myip: null, error: true };
        }
    } catch (_) {
        renderer?.updateRow("myip", null);
        return { myip: null, error: true };
    }
}

// ---------------------------------------------------------------------------
// MX — Show actual MX record hostname (clickable to MXToolbox)
// ---------------------------------------------------------------------------

export async function resolveMXRow(renderer, originalDomain) {
    if (renderer?.isCancelled()) return;
    try {
        const mxResp = await raceTimeout(
            chrome.runtime.sendMessage({ command: "dns", payload: { domain: originalDomain, type: "MX" } }),
            ROW_TIMEOUT
        );
        if (renderer?.isCancelled()) return;

        const mxRecords = mxResp?.data?.Answer?.filter(a => a.type === 15) || [];
        if (mxRecords.length > 0) {
            // Extract the hostname from MX data ("10 smtp-in.l.google.com.")
            const mxHost = mxRecords[0].data
                ?.split(/\s+/).pop()
                ?.replace(/\.$/, "")
                || "";
            if (mxHost) {
                renderer?.updateRow("mx", mxHost);
                updateMXField(mxHost, `https://mxtoolbox.com/SuperTool.aspx?action=mx:${originalDomain}`);
                setSessionTriad("mx", mxHost);
                return { mx: mxHost, error: false };
            } else {
                renderer?.updateRow("mx", null);
                return { mx: null, error: false }; // No MX is not an error
            }
        } else {
            renderer?.updateRow("mx", null);
            return { mx: null, error: false }; // No MX is not an error
        }
    } catch (_) {
        renderer?.updateRow("mx", null);
        return { mx: null, error: true }; // Timeout or exception is an error
    }
}

function raceTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms)),
    ]);
}
