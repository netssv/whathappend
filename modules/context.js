/**
 * WhatHappened — Context Manager
 *
 * Tracks the active tab's domain and manages manual target overrides.
 * Exported as a singleton for use by formatter.js and terminal.js.
 */

export const ContextManager = {
    currentTarget: null,
    _manualTarget: null,
    _isManual: false,
    _barEl: null,
    _logoEl: null,
    _domainEl: null,
    _onTargetChanged: null,
    _onTabChanged: null,

    async init() {
        this._barEl = document.getElementById("context-bar");
        this._logoEl = document.getElementById("context-logo");
        this._domainEl = document.getElementById("context-domain");

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "domain-changed" && message.domain) {
                this._updateDomain(message.domain);
            }
        });
        
        return await this._requestDomain();
    },

    /**
     * Register a callback for when the target domain changes.
     * Used by terminal.js to trigger auto-whois.
     */
    onTargetChanged(fn) {
        this._onTargetChanged = fn;
    },

    /**
     * Register a callback for when the active browser tab changes.
     * Used by terminal.js to show a discrete tab-switch notification.
     */
    onTabChanged(fn) {
        this._onTabChanged = fn;
    },

    async _requestDomain() {
        try {
            const response = await chrome.runtime.sendMessage({
                command: "get-active-domain",
            });
            if (response?.domain) {
                this._updateDomain(response.domain);
                return response.domain;
            }
        } catch (_err) {}
        return null;
    },

    _updateDomain(domain) {
        if (this._isManual) return;
        if (domain === this.currentTarget) return;
        const prev = this.currentTarget;
        this.currentTarget = domain;

        if (this._domainEl) {
            this._domainEl.value = domain;
        }
        if (this._barEl) {
            this._barEl.classList.add("active");
            this._barEl.classList.remove("manual", "pulse");
            void this._barEl.offsetWidth;
            this._barEl.classList.add("pulse");
        }

        // Notify tab-change listener (discrete terminal notification)
        if (prev && typeof this._onTabChanged === "function") {
            this._onTabChanged(domain, prev);
        }
    },

    setManualTarget(domain) {
        this._manualTarget = domain;
        this._isManual = true;

        if (this._domainEl) {
            this._domainEl.value = domain;
        }
        if (this._barEl) {
            this._barEl.classList.add("active", "manual");
            this._barEl.classList.remove("pulse");
            void this._barEl.offsetWidth;
            this._barEl.classList.add("pulse");
        }

        // Notify listener (e.g. auto-whois in terminal.js)
        if (typeof this._onTargetChanged === "function") {
            this._onTargetChanged(domain);
        }
    },

    resetToAuto() {
        this._manualTarget = null;
        this._isManual = false;
        if (this._barEl) {
            this._barEl.classList.remove("manual");
        }
        this._requestDomain();
    },

    isManual() {
        return this._isManual;
    },

    getDomain() {
        if (this._isManual && this._manualTarget) return this._manualTarget;
        return this.currentTarget;
    },
};
