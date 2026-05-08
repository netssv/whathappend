/**
 * @module modules/terminal/header/header-triad.js
 * @description Architectural connections and module role.
 * 
 * @connections
 * - Imports: 
 *     - ContextManager from '../../context.js'
 *     - refitTerminal from '../terminal-ui.js'
 *     - toApex from '../../formatter.js'
 *     - setSessionTriad from '../../state.js'
 *     - handleTriadRetryClick from './header-retry.js'
 * - Exports: updateWhoisFields, updateNSField, updateHostField, markFieldRetryable, clearWhoisFields, pingTriadVisibility
 * - Layer: Terminal Layer (Header) - Renders the top UI header blocks.
 */

import { initTriadEvents } from "./header-triad-events.js";
import { ContextManager } from "../../context.js";
import { 
    contextHttp, contextRegistrar, contextNS, contextHost, contextIP, contextMyIP, 
    contextGeo, contextSSL, contextCDN, contextMX, contextTriad, 
    ALL_FIELDS, refreshTriadVisibility, setTriadValue, 
    cancelAutoHide, setAutoHide, setTriadHoverState
} from "./header-triad-ui.js";

// ===================================================================
// Header Triad — Infrastructure badges (REG / NS / HOST)
//
// Manages visibility, click-to-verify, retryable state, and
// single-field retry on user click.
// ===================================================================

// ---------------------------------------------------------------------------
// Initialize Event Listeners
// ---------------------------------------------------------------------------

initTriadEvents({
    contextTriad, ALL_FIELDS,
    setTriadValue, refreshTriadVisibility,
    cancelAutoHide, setAutoHide, setTriadHoverState
});

// ---------------------------------------------------------------------------
// Public update functions
// ---------------------------------------------------------------------------

export function updateHttpField(code, url) {
    if (contextHttp) {
        // Clear old color classes
        contextHttp.classList.remove("ssl-active", "ssl-warning", "ssl-expired");
        setTriadValue(contextHttp, code ? `${code}` : "", url);
        
        // Add color coding
        if (code) {
            const numericCode = parseInt(code, 10);
            if (numericCode >= 200 && numericCode < 300) {
                contextHttp.classList.add("ssl-active"); // Green
            } else if (numericCode >= 300 && numericCode < 400) {
                contextHttp.classList.add("ssl-warning"); // Yellow
            } else if (numericCode >= 400) {
                contextHttp.classList.add("ssl-expired"); // Red
            }
        }
    }
}

export function updateWhoisFields(registrar, url) {
    setTriadValue(contextRegistrar, registrar, url);
}

export function updateNSField(ns, url) {
    setTriadValue(contextNS, ns, url);
}

export function updateHostField(host, url) {
    setTriadValue(contextHost, host, url);
}

export function updateIPField(ip) {
    setTriadValue(contextIP, ip, `https://ipinfo.io/${ip}`);
}

export function updateMyIPField(ip) {
    setTriadValue(contextMyIP, ip, `https://ipinfo.io/${ip}`);
}

export function updateGeoField(geo) {
    const domain = ContextManager.getDomain();
    setTriadValue(contextGeo, geo, domain ? `https://check-host.net/ip-info?host=${domain}` : null);
}

export function updateSSLField(ssl, daysLeft) {
    // Clear previous SSL color classes
    contextSSL?.classList.remove("ssl-active", "ssl-warning", "ssl-expired");
    const domain = ContextManager.getDomain();
    const url = domain ? `https://www.ssllabs.com/ssltest/analyze.html?d=${domain}` : null;

    if (daysLeft !== undefined && daysLeft !== null) {
        const label = daysLeft >= 0 ? `Active ${daysLeft}d` : `Expired ${daysLeft}d`;
        setTriadValue(contextSSL, label, url);
        if (daysLeft < 0) {
            contextSSL?.classList.add("ssl-expired");
        } else if (daysLeft <= 30) {
            contextSSL?.classList.add("ssl-warning");
        } else {
            contextSSL?.classList.add("ssl-active");
        }
    } else {
        setTriadValue(contextSSL, ssl, url);
    }
}

export function updateCDNField(cdn) {
    const domain = ContextManager.getDomain();
    setTriadValue(contextCDN, cdn, domain ? `https://builtwith.com/${domain}` : null);
}

export function updateMXField(mx, url) {
    setTriadValue(contextMX, mx, url);
}

/**
 * Mark a triad field as retryable (shows pulsing ↻ retry indicator).
 */
export function markFieldRetryable(field) {
    const el = { 
        http: contextHttp,
        registrar: contextRegistrar, 
        ns: contextNS, 
        host: contextHost,
        ip: contextIP,
        myip: contextMyIP,
        geo: contextGeo,
        ssl: contextSSL,
        cdn: contextCDN,
        mx: contextMX
    }[field];
    if (!el || el.textContent) return; // Only mark if empty
    el.classList.add("retryable");
    refreshTriadVisibility();
}

/**
 * Clear all infrastructure badges (called before a new async lookup starts).
 */
export function clearWhoisFields() {
    ALL_FIELDS.forEach(el => {
        if (el) {
            el.textContent = ""; el.title = "";
            delete el.dataset.href;
            el.classList.remove("clickable", "retryable", "retrying", "ssl-active", "ssl-warning", "ssl-expired");
        }
    });
    refreshTriadVisibility();
}

// ---------------------------------------------------------------------------
// Retry click handler — single-field retry on user click
// ---------------------------------------------------------------------------

export function pingTriadVisibility() {
    refreshTriadVisibility();
}
