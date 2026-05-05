/**
 * @module modules/terminal/header/header-triad-ui.js
 * @description Core UI updates for the infrastructure triad.
 */

import { refitTerminal } from "../terminal-ui.js";

export const contextHttp = document.getElementById("context-http");
export const contextRegistrar = document.getElementById("context-registrar");
export const contextNS = document.getElementById("context-ns");
export const contextHost = document.getElementById("context-host");
export const contextIP = document.getElementById("context-ip");
export const contextMyIP = document.getElementById("context-myip");
export const contextGeo = document.getElementById("context-geo");
export const contextSSL = document.getElementById("context-ssl");
export const contextCDN = document.getElementById("context-cdn");
export const contextMX = document.getElementById("context-mx");
export const contextTriad = document.getElementById("context-triad");

export const ALL_FIELDS = [contextHttp, contextRegistrar, contextNS, contextHost, contextIP, contextMyIP, contextGeo, contextSSL, contextCDN, contextMX];

let hideTimeout = null;
let currentVisibilityCheck = 0;
let isHovering = false;

export function setTriadHoverState(state) {
    isHovering = state;
}

export function refreshTriadVisibility() {
    if (!contextTriad) return;

    // During peek-tease animation, don't auto-show the triad
    if (contextTriad.hasAttribute("data-peek-active")) return;

    const hasAny = ALL_FIELDS.some(el => el?.textContent)
        || contextRegistrar?.classList.contains("retryable")
        || contextNS?.classList.contains("retryable")
        || contextHost?.classList.contains("retryable");

    const peekTab = document.getElementById("header-peek-tab");

    if (hasAny) {
        // Only run auto-hide logic if the triad is CURRENTLY visible
        // Do NOT automatically force it open to prevent covering the TUI
        if (contextTriad.classList.contains("visible")) {
            if (hideTimeout) clearTimeout(hideTimeout);
            
            const checkId = ++currentVisibilityCheck;
            chrome.storage.local.get("wh_config").then(data => {
                if (checkId !== currentVisibilityCheck) return;
                const config = data["wh_config"] || {};
                const autoHide = config["autoHide"] !== undefined ? config["autoHide"] : true;
                const autoHideDelay = config["autoHideDelay"] || 5000;
                if (autoHide && !isHovering) {
                    hideTimeout = setTimeout(() => {
                        contextTriad.classList.remove("visible");
                        if (peekTab) peekTab.classList.remove("peek-open");
                        setTimeout(() => refitTerminal(), 350);
                    }, autoHideDelay);
                }
            });
        }
    } else {
        contextTriad.classList.remove("visible");
        if (peekTab) peekTab.classList.remove("peek-open");
    }
    // Re-fit terminal after CSS transition completes
    setTimeout(() => refitTerminal(), 350);
}

let teaseTimeout = null;
let teaseCleanupTimeout = null;
let teaseHasFired = false;

export function triggerPeekTease() {
    const peekTab = document.getElementById("header-peek-tab");
    if (!peekTab || !contextTriad) return;

    // Only fire once — don't restart if already active or already played
    if (teaseHasFired) return;
    teaseHasFired = true;

    // Block auto-show during tease period
    contextTriad.setAttribute("data-peek-active", "");

    // Start tease after a brief moment for DOM to settle
    teaseTimeout = setTimeout(() => {
        peekTab.classList.add("peek-bounce");
        contextTriad.classList.add("peek-tease");
        
        // Clean up tease after animation ends
        teaseCleanupTimeout = setTimeout(() => {
            contextTriad.classList.remove("peek-tease");
            contextTriad.removeAttribute("data-peek-active");
            refitTerminal();
        }, 2100);
    }, 80);
}

/** Allow the tease to fire again (e.g. after domain change) */
export function resetPeekTease() {
    teaseHasFired = false;
    if (teaseTimeout) clearTimeout(teaseTimeout);
    if (teaseCleanupTimeout) clearTimeout(teaseCleanupTimeout);
    const peekTab = document.getElementById("header-peek-tab");
    if (peekTab) peekTab.classList.remove("peek-bounce");
    if (contextTriad) {
        contextTriad.classList.remove("peek-tease");
        contextTriad.removeAttribute("data-peek-active");
    }
}

export function cancelAutoHide() {
    if (hideTimeout) clearTimeout(hideTimeout);
    currentVisibilityCheck++;
}

export function setAutoHide(delay) {
    hideTimeout = setTimeout(() => {
        contextTriad.classList.remove("visible");
        setTimeout(() => refitTerminal(), 350);
    }, delay);
}

export function cleanProviderName(name) {
    if (!name) return "";
    return name
        .replace(/,?\s+Inc\.?$/i, "")
        .replace(/,?\s+LLC\.?$/i, "")
        .replace(/,?\s+LTD\.?$/i, "")
        .replace(/\s+GmbH$/i, "")
        .replace(/\s+NOC$/i, "")
        .replace(/\s+Group$/i, "")
        .replace(/Amazon\.com Services LLC/i, "AWS")
        .replace(/Amazon Data Services.*/i, "AWS")
        .replace(/Google LLC/i, "Google")
        .trim();
}

export function setTriadValue(el, text, url) {
    if (!el) return;
    const cleanText = cleanProviderName(text);
    el.textContent = cleanText || "";
    el.title = url ? `${text} — click to verify` : (text || "");
    // Clear loading/retryable state when a real value arrives
    el.classList.remove("retryable", "retrying");
    if (url) {
        el.dataset.href = url;
        el.classList.add("clickable");
    } else {
        delete el.dataset.href;
        el.classList.remove("clickable");
    }
    
    // Trigger subtle pop animation on value update
    el.classList.remove("pop");
    void el.offsetWidth; // Force DOM reflow to restart animation
    if (cleanText) el.classList.add("pop");

    if (cleanText && contextTriad && !contextTriad.classList.contains("visible")) {
        triggerPeekTease();
    }

    refreshTriadVisibility();
}
