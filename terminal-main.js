import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory, restoreSession, setSessionTarget } from "./modules/state.js";
import { showBanner, writePrompt, term, refitTerminal } from "./modules/terminal/terminal-ui.js";
import { initHeaderController, clearWhoisFields, showTabSwitch, hideTabSwitch, initBlockPanel, updateBlockState, initLogoMenu } from "./modules/terminal/header-controller.js";
import { triggerPeekTease } from "./modules/terminal/header/header-triad-ui.js";
import { handleSessionRestore } from "./modules/terminal/session-restorer.js";
import { initInputManager } from "./modules/terminal/input/index.js";
import { InputEvents } from "./modules/terminal/input/events.js";
import { setKeyboardLock } from "./modules/terminal/input/keyboard-events.js";
import { getConfig } from "./modules/commands/util/config.js";
import { retryEmptyHeaderFields } from "./modules/core/triage-retries.js";

// ---------------------------------------------------------------------------
// Isolated Block-Panel Sync — fire-and-forget, never crashes triage
// ---------------------------------------------------------------------------

async function syncBlockPanelSafe() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.url) await updateBlockState(tabs[0].url);
    } catch (e) {
        console.warn("[WH] Block panel sync failed (non-fatal):", e);
    }
}

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

async function bootstrap() {
    try {
        // 1. Setup the terminal multiplexer and create first UI session
        const { TerminalMultiplexer } = await import("./modules/terminal/terminal-multiplexer.js");
        await TerminalMultiplexer.init();

        // 2. Initialize header UI, block panel, logo menu
        initHeaderController(term);
        initBlockPanel();
        initLogoMenu();

        // 3. Initialize the input loop and event listeners (handled by Multiplexer now)

        // 4. (Banner is shown by Multiplexer now)

        // 5. Restore previous session (if panel was closed and reopened)
        const session = await restoreSession();

        // 6. Context Manager Init + Initial Auto-Analysis
        const initialDomain = await ContextManager.init();

        const restored = handleSessionRestore(session, initialDomain);
        if (!restored && initialDomain && initialDomain !== "restricted") {
            // ALWAYS set manual target so the Side Panel is "sticky" to the starting domain.
            // This prevents auto-switching and enables the tab-switch popup.
            ContextManager.setManualTarget(initialDomain);
            
            // Check auto-triage setting
            /* const autoTriage = await getConfig("auto-triage");
            if (autoTriage) {
                setTimeout(() => {
                    term.write("start\r\n");
                    executeCommand("start");
                }, 100); 
            }*/
        } else if (!restored) {
            // writePrompt() already called by multiplexer createSession
        }

        // Fallback: auto-focus if user clicks anywhere in the panel background
        document.addEventListener("click", (e) => {
            if (!e.target.closest("button") && e.target.tagName !== "INPUT" && e.target.tagName !== "A") {
                grabFocus();
            }
        });

        // Final refit: ensure terminal dimensions are correct after all header
        // UI (triad cards, block panel) has settled. Without this, the banner
        // can scroll off-screen if the header takes more space than expected.
        setTimeout(() => {
            refitTerminal();
            term.scrollToBottom();
        }, 400);

    } catch (err) {
        console.error("[WhatHappened] Bootstrap failed:", err);
        import("./modules/terminal/bootstrap-error.js").then(m => m.showBootstrapError(err));
    }
}

// ---------------------------------------------------------------------------
// Internal Execution Bridge
// ---------------------------------------------------------------------------

/**
 * Execute a command by simulating it passing through the input loop.
 */
function executeCommand(commandName, args = []) {
    const input = [commandName, ...args].join(" ").trim();
    InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, input);
}

// Ensure terminal always grabs focus on open
function grabFocus() {
    setTimeout(() => {
        const textarea = document.querySelector(".xterm-helper-textarea");
        if (textarea) textarea.focus();
    }, 50);
}

window.addEventListener("focus", grabFocus);


bootstrap();

// Async Header: When ANY target domain changes (auto or manual)
ContextManager.onDomainChanged(async (domain) => {
    if (!domain || domain === "restricted" || isIPAddress(domain)) return;
    
    try {
        const { TerminalMultiplexer } = await import("./modules/terminal/terminal-multiplexer.js");
        TerminalMultiplexer.setSessionDomain(TerminalMultiplexer.activeSession, domain);
    } catch {}
    
    // Clear stale badges immediately — triage resolvers will repopulate
    clearWhoisFields();
});

// Async Header: When a manual target is set.
// The progressive triage resolvers in triage-resolvers.js will populate
// the header triad as each row resolves — single source of truth.
ContextManager.onTargetChanged(async (domain) => {
    if (!domain || isIPAddress(domain)) return;

    // Save to multiplexer session
    try {
        const { TerminalMultiplexer } = await import("./modules/terminal/terminal-multiplexer.js");
        TerminalMultiplexer.setSessionDomain(TerminalMultiplexer.activeSession, domain);
    } catch {}

    // Hide any pending tab-switch notification (user already switched)
    hideTabSwitch();

    // Update header logo to domain favicon (use apex for better reliability)
    const logoEl = document.getElementById("context-logo");
    if (logoEl) {
        logoEl.src = `https://www.google.com/s2/favicons?domain=${toApex(domain)}&sz=64`;
        logoEl.style.borderRadius = "3px"; // Make it look like a neat icon
    }

    // Persist target for session restore
    setSessionTarget(domain);
    
    // Trigger the bounce and tease animation
    triggerPeekTease();

    // Trigger silent background triage for the header triad (always runs)
    try {
        retryEmptyHeaderFields(domain, toApex(domain), { registrar: null, ns: null, webhost: null, ip: null, myip: null, geo: null, ssl: null, cdn: null, http: null, mx: null });
    } catch (e) {
        console.warn("[WH] Background triage init error:", e);
    }

    // Sync content-block shield state (isolated — must never affect triage)
    syncBlockPanelSafe();
});

// Tab-change notification: Show interactive bar so user can choose to switch
ContextManager.onTabChanged((domain, prev) => {
    // Don't suggest switching if the new domain is invalid or matches the current target
    if (domain === "restricted" || !domain) return;
    
    const current = ContextManager.getDomain();
    if (current && toApex(domain) === toApex(current)) return;

    showTabSwitch(domain, (newDomain) => {
        // User clicked "Switch" — adopt the new domain and run triage
        ContextManager.setManualTarget(newDomain);
        writePrompt();
        term.write(newDomain + "\r\n");
        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, newDomain);
    });
});
