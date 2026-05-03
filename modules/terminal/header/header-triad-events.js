/**
 * @module modules/terminal/header/header-triad-events.js
 * @description Event listeners for the infrastructure triad.
 */

import { handleTriadRetryClick } from "./header-retry.js";
import { refitTerminal } from "../terminal-ui.js";

export function initTriadEvents(api) {
    const {
        contextTriad, ALL_FIELDS,
        setTriadValue, refreshTriadVisibility,
        cancelAutoHide, setAutoHide, setTriadHoverState
    } = api;

    if (contextTriad) {
        contextTriad.addEventListener("click", (e) => {
            // Handle retry clicks on empty fields
            const retryTarget = e.target.closest(".triad-value.retryable");
            if (retryTarget) {
                const fieldMap = {};
                ALL_FIELDS.forEach(el => {
                    if (el?.id) fieldMap[el.id] = el;
                });
                let type;
                if (retryTarget.id === "context-registrar") type = "registrar";
                else if (retryTarget.id === "context-http") type = "http";
                else if (retryTarget.id === "context-ns") type = "ns";
                else if (retryTarget.id === "context-host") type = "host";
                else if (retryTarget.id === "context-ip") type = "ip";
                else if (retryTarget.id === "context-myip") type = "myip";
                else if (retryTarget.id === "context-geo") type = "geo";
                else if (retryTarget.id === "context-ssl") type = "ssl";
                else if (retryTarget.id === "context-cdn") type = "cdn";
                else if (retryTarget.id === "context-mx") type = "mx";
                if (type) handleTriadRetryClick(retryTarget, type, setTriadValue);
                return;
            }
            // Handle verify clicks on populated fields
            const target = e.target.closest(".triad-value[data-href]");
            if (target?.dataset.href) {
                chrome.tabs.create({ url: target.dataset.href });
            }
        });

        // Right-click on any triad value → copy to clipboard
        contextTriad.addEventListener("contextmenu", (e) => {
            const target = e.target.closest(".triad-value");
            if (target && target.textContent) {
                e.preventDefault();
                const text = target.textContent.trim();
                navigator.clipboard.writeText(text).then(() => {
                    // Visual feedback: brief flash
                    const original = target.style.color;
                    target.style.color = "var(--accent-green)";
                    target.title = `Copied: ${text}`;
                    setTimeout(() => {
                        target.style.color = original;
                    }, 800);
                }).catch(() => {});
            }
        });

        contextTriad.addEventListener("mouseenter", () => {
            setTriadHoverState(true);
            cancelAutoHide();
        });
        
        contextTriad.addEventListener("mouseleave", () => {
            setTriadHoverState(false);
            if (contextTriad.classList.contains("visible")) {
                chrome.storage.local.get("wh_config").then(data => {
                    const config = data["wh_config"] || {};
                    const autoHide = config["autoHide"] !== undefined ? config["autoHide"] : true;
                    if (autoHide) setAutoHide(config["autoHideDelay"] || 5000);
                });
            }
        });
    }

    const peekTab = document.getElementById("header-peek-tab");
    if (peekTab && contextTriad) {
        peekTab.addEventListener("click", () => {
            // Clear any running tease animation and unlock visibility
            contextTriad.classList.remove("peek-tease");
            contextTriad.removeAttribute("data-peek-active");
            
            cancelAutoHide();
            contextTriad.classList.toggle("visible");
            peekTab.classList.toggle("peek-open", contextTriad.classList.contains("visible"));
            setTimeout(() => refitTerminal(), 350);
        });
    }

    chrome.tabs?.onActivated?.addListener(() => {
        if (contextTriad && contextTriad.classList.contains("visible")) {
            chrome.storage.local.get("wh_config").then(data => {
                const config = data["wh_config"] || {};
                const autoHide = config["autoHide"] !== undefined ? config["autoHide"] : true;
                const autoHideDelay = config["autoHideDelay"] || 5000;
                if (autoHide) {
                    cancelAutoHide();
                    setAutoHide(autoHideDelay);
                }
            });
        }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes["wh_config"]) {
            const oldAuto = changes["wh_config"].oldValue?.["autoHide"];
            const newAuto = changes["wh_config"].newValue?.["autoHide"];
            
            // If user manually turned ON auto-hide, hide it immediately instead of waiting
            if (oldAuto === false && newAuto === true) {
                if (contextTriad) {
                    contextTriad.classList.remove("visible");
                    if (peekTab) peekTab.classList.remove("peek-open");
                    cancelAutoHide();
                    setTimeout(() => refitTerminal(), 350);
                }
            } else {
                refreshTriadVisibility();
            }
        }
    });
}
