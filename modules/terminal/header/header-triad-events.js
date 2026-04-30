/**
 * @module modules/terminal/header/header-triad-events.js
 * @description Event listeners for the infrastructure triad.
 */

import { handleTriadRetryClick } from "./header-retry.js";
import { refitTerminal } from "../terminal-ui.js";

export function initTriadEvents(api) {
    const {
        contextTriad, contextRegistrar, contextNS, contextHost,
        setTriadValue, refreshTriadVisibility,
        cancelAutoHide, setAutoHide
    } = api;

    if (contextTriad) {
        contextTriad.addEventListener("click", (e) => {
            // Handle retry clicks on empty fields
            const retryTarget = e.target.closest(".triad-value.retryable");
            if (retryTarget) {
                let type;
                if (retryTarget === contextRegistrar) type = "registrar";
                else if (retryTarget === contextNS) type = "ns";
                else if (retryTarget === contextHost) type = "host";
                if (type) handleTriadRetryClick(retryTarget, type, setTriadValue);
                return;
            }
            // Handle verify clicks on populated fields
            const target = e.target.closest(".triad-value[data-href]");
            if (target?.dataset.href) {
                chrome.tabs.create({ url: target.dataset.href });
            }
        });
    }

    const triadHandle = document.getElementById("triad-handle");
    if (triadHandle && contextTriad) {
        triadHandle.addEventListener("click", () => {
            cancelAutoHide();
            contextTriad.classList.toggle("visible");
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
                    if (triadHandle) triadHandle.classList.remove("visible");
                    cancelAutoHide();
                    setTimeout(() => refitTerminal(), 350);
                }
            } else {
                refreshTriadVisibility();
            }
        }
    });
}
