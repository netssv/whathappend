import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory, restoreSession, setSessionTarget } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, term, refitTerminal } from "./modules/terminal/terminal-ui.js";
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
        // 1. Setup the terminal UI visually
        await initTerminalUI("terminal-container");

        // 2. Initialize header UI, block panel, logo menu
        initHeaderController(term);
        initBlockPanel();
        initLogoMenu();

        // 3. Initialize the input loop and event listeners
        initInputManager();

        // 4. Show initial prompt
        showBanner();

        // 5. Restore previous session (if panel was closed and reopened)
        const session = await restoreSession();

        // 6. Context Manager Init + Initial Auto-Analysis
        const initialDomain = await ContextManager.init();

        const restored = handleSessionRestore(session, initialDomain);
        if (!restored && initialDomain && initialDomain !== "restricted") {
            writePrompt();
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
            writePrompt();
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
        showBootstrapError(err);
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

function showBootstrapError(err) {
    const termC = document.getElementById("terminal-container");
    if (termC) {
        termC.replaceChildren();

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "padding: 20px; font-family: monospace;";

        const h3 = document.createElement("h3");
        h3.style.cssText = "color:#ff3366;margin-top:0";
        h3.textContent = "⚠️ Terminal Core Failure";
        wrapper.appendChild(h3);

        const desc = document.createElement("p");
        desc.style.cssText = "color:#aaa;margin:0 0 8px";
        desc.textContent = "The terminal could not initialize. This is usually caused by a corrupt extension state or a failed module import.";
        wrapper.appendChild(desc);

        const pre = document.createElement("pre");
        pre.style.cssText = "color:#ff6b6b;background:#0f0f23;padding:12px;border-radius:6px;overflow:auto;max-height:120px;font-size:12px";
        pre.textContent = `${err?.message || "Unknown error"}\n${err?.stack || ""}`;
        wrapper.appendChild(pre);

        const fixTitle = document.createElement("p");
        fixTitle.style.cssText = "color:#888;margin:16px 0 8px";
        fixTitle.textContent = "Try one of these fixes:";
        wrapper.appendChild(fixTitle);

        const ol = document.createElement("ol");
        ol.style.cssText = "color:#ccc;padding-left:20px;line-height:1.8";
        const fixes = [
            "Close and reopen the Side Panel",
            "Go to chrome://extensions → click Reload on WhatHappened",
            "If the issue persists, clear extension storage via DevTools"
        ];
        for (const fix of fixes) {
            const li = document.createElement("li");
            li.textContent = fix;
            ol.appendChild(li);
        }
        wrapper.appendChild(ol);

        termC.appendChild(wrapper);
    }
}

bootstrap();

// Async Header: When ANY target domain changes (auto or manual)
ContextManager.onDomainChanged((domain) => {
    if (!domain || domain === "restricted" || isIPAddress(domain)) return;
    
    // Clear stale badges immediately — triage resolvers will repopulate
    clearWhoisFields();
});

// Async Header: When a manual target is set.
// The progressive triage resolvers in triage-resolvers.js will populate
// the header triad as each row resolves — single source of truth.
ContextManager.onTargetChanged(async (domain) => {
    if (!domain || isIPAddress(domain)) return;

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
