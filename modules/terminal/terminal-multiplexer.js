import { createTerminalInstance, showBanner, writePrompt } from "./terminal-ui.js";
import { initInputManager, attachSessionTerminal } from "./input/index.js";
import { createTabDOM, updateTabDomainUI, updateTabActivityUI, syncChromeBadge } from "./multiplexer-ui.js";

class Session {
    constructor(id) {
        this.id = id;
        this.container = document.createElement("div");
        this.container.className = "multiplexer-session";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        
        this.term = null;
        this.fitAddon = null;
        this.activity = "idle"; // idle | processing | watching
    }
}

export const TerminalMultiplexer = {
    sessions: [],
    activeSession: null,
    isInputInitialized: false,
    
    async init() {
        this.tabBar = document.getElementById("terminal-tabs-bar");
        this.container = document.getElementById("terminal-container");
        this.addBtn = document.getElementById("multiplexer-add-btn");
        
        this.addBtn.addEventListener("click", () => this.createSession());
        
        // Remove static tab and clear container
        this.tabBar.querySelectorAll(".multiplexer-tab").forEach(e => e.remove());
        this.container.innerHTML = "";
        
        await this.createSession();
    },
    
    async createSession() {
        if (this.sessions.length >= 8) {
            import("./terminal-ui.js").then(m => m.writeOutput("\x1b[33m[!] Maximum session limit (8) reached.\x1b[0m"));
            return null;
        }

        const id = this._nextAvailableId();
        const session = new Session(id);
        this.sessions.push(session);
        
        const tabEl = createTabDOM(id);
        
        tabEl.addEventListener("click", (e) => {
            if (e.target.classList.contains("tab-close")) {
                this.closeSession(session);
            } else {
                this.switchToSession(session);
            }
        });
        
        this.tabBar.insertBefore(tabEl, this.addBtn);
        this.container.appendChild(session.container);
        this._refreshTabLabels();
        
        await this.switchToSession(session);
        
        // Initialize xterm for this session
        const instances = await createTerminalInstance(session.container);
        session.term = instances.term;
        session.fitAddon = instances.fitAddon;
        
        if (!this.isInputInitialized) {
            initInputManager();
            this.isInputInitialized = true;
        }
        
        attachSessionTerminal(session.term);
        
        showBanner();
        writePrompt();
        return session;
    },
    
    async switchToSession(session) {
        this.activeSession = session;
        
        // Re-sync ALL tabs: active class + activity state
        this.sessions.forEach(s => {
            const tabEl = this.tabBar.querySelector(`.multiplexer-tab[data-tab-id="${s.id}"]`);
            if (!tabEl) return;
            
            tabEl.classList.toggle("active", s === session);
            updateTabActivityUI(tabEl, s.activity);
        });
        
        this.sessions.forEach(s => {
            s.container.style.display = s === session ? "block" : "none";
        });
        
        if (session.term) {
            session.term.focus();
            if (session.fitAddon) session.fitAddon.fit();
        }
        
        // Sync keyboard lock to match the target session's activity.
        try {
            const { setKeyboardLock } = await import("./input/keyboard-events.js");
            const isBusy = session.activity === "processing" || session.activity === "watching";
            setKeyboardLock(isBusy);
        } catch {}
        
        // Sync context
        try {
            const { ContextManager } = await import("../context.js");
            if (session.domain) {
                ContextManager.setManualTarget(session.domain);
            } else {
                ContextManager.resetToAuto();
            }
        } catch {}
    },
    
    closeSession(session) {
        if (this.sessions.length === 1) return;
        
        const tabEl = this.tabBar.querySelector(`.multiplexer-tab[data-tab-id="${session.id}"]`);
        if (tabEl) tabEl.remove();
        if (session.container) session.container.remove();
        if (session.term) {
            import("./theme-engine.js").then(m => m.removeThemeEngineRef(session.term));
            session.term.dispose();
        }
        
        this.sessions = this.sessions.filter(s => s !== session);
        this._refreshTabLabels();
        
        if (this.activeSession === session) {
            this.switchToSession(this.sessions[this.sessions.length - 1]);
        }
    },
    
    setSessionDomain(session, domain) {
        if (!session) return;
        session.domain = domain;
        
        const tabEl = this.tabBar.querySelector(`.multiplexer-tab[data-tab-id="${session.id}"]`);
        updateTabDomainUI(tabEl, domain);
    },
    
    /**
     * Sets the activity state of a session tab.
     * @param {Session} session
     * @param {"idle"|"processing"|"watching"} state
     */
    setSessionActivity(session, state) {
        if (!session) return;
        session.activity = state;
        
        const tabEl = this.tabBar?.querySelector(`.multiplexer-tab[data-tab-id="${session.id}"]`);
        updateTabActivityUI(tabEl, state);
        syncChromeBadge(this.sessions);
    },
    
    _nextAvailableId() {
        const usedIds = new Set(this.sessions.map(s => s.id));
        for (let i = 1; i <= 8; i++) {
            if (!usedIds.has(i)) return i;
        }
        return this.sessions.length + 1;
    },
    
    _refreshTabLabels() {
        this.sessions.forEach((session, index) => {
            const tabEl = this.tabBar.querySelector(`.multiplexer-tab[data-tab-id="${session.id}"]`);
            if (!tabEl) return;
            const titleEl = tabEl.querySelector(".tab-title");
            if (titleEl && !session.domain) {
                titleEl.textContent = `Term ${index + 1}`;
            }
            tabEl.title = `Terminal Session ${index + 1}`;
        });
    }
};
