import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory, restoreSession, setSessionTarget } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, term } from "./modules/terminal/terminal-ui.js";
import { initHeaderController, clearWhoisFields, showTabSwitch, hideTabSwitch, initBlockPanel, updateBlockState, initLogoMenu } from "./modules/terminal/header-controller.js";
import { handleSessionRestore } from "./modules/terminal/session-restorer.js";
import { initInputManager } from "./modules/terminal/input/index.js";
import { InputEvents } from "./modules/terminal/input/events.js";
import { setKeyboardLock } from "./modules/terminal/input/keyboard-events.js";
import { getConfig } from "./modules/commands/util/config.js";
import { retryEmptyHeaderFields } from "./modules/core/triage-retries.js";

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

async function bootstrap() {
    try {
        // 1. Setup the terminal UI visually
        await initTerminalUI("terminal-container");

        // 2. Setup the header logic
        initHeaderController(term);
        initBlockPanel();
        initLogoMenu();

        // 3. Setup the input manager (keyboard, paste, execution)
        initInputManager();

        // 4. Show initial prompt
        showBanner();

        // 5. Restore previous session (if panel was closed and reopened)
        const session = await restoreSession();

        // 6. Context Manager Init + Initial Auto-Analysis
        const initialDomain = await ContextManager.init();

        const restored = handleSessionRestore(session, initialDomain);
        if (!restored && initialDomain) {
            writePrompt();
            
            const autoTriage = await getConfig("auto-triage");
            if (autoTriage) {
                ContextManager.setManualTarget(initialDomain);
            }
        } else {
            writePrompt();
        }

        const grabFocus = () => {
            document.body.focus();
            const textarea = document.querySelector('.xterm-helper-textarea');
            if (textarea) {
                textarea.setAttribute('autofocus', 'true');
                textarea.focus({ preventScroll: true });
            }
            term.focus();
        };
        
        // Try multiple times to ensure the side panel catches the focus
        setTimeout(grabFocus, 100);
        setTimeout(grabFocus, 300);
        setTimeout(grabFocus, 600);

        // Fallback: auto-focus if user clicks anywhere in the panel background
        document.addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT" && e.target.tagName !== "A") {
                grabFocus();
            }
        });

    } catch (err) {
        console.error("[WhatHappened] Bootstrap failed:", err);
        showBootstrapError(err);
    }
}

// ---------------------------------------------------------------------------
// Fallback UI — visible error when bootstrap fails (prevents blank panel)
// ---------------------------------------------------------------------------

function showBootstrapError(err) {
    const container = document.getElementById("terminal-container");
    if (container) {
        container.innerHTML = `
            <div style="padding:24px;font-family:monospace;color:#ff6b6b;background:#1a1a2e;height:100%;box-sizing:border-box;">
                <h2 style="color:#e94560;margin:0 0 12px">⚠ WhatHappened failed to start</h2>
                <p style="color:#aaa;margin:0 0 8px">The terminal could not initialize. This is usually caused by a corrupt extension state or a failed module import.</p>
                <pre style="color:#ff6b6b;background:#0f0f23;padding:12px;border-radius:6px;overflow:auto;max-height:120px;font-size:12px">${err?.message || "Unknown error"}\n${err?.stack || ""}</pre>
                <p style="color:#888;margin:16px 0 8px">Try one of these fixes:</p>
                <ol style="color:#ccc;padding-left:20px;line-height:1.8">
                    <li>Close and reopen the Side Panel</li>
                    <li>Go to <code style="color:#00d2ff">chrome://extensions</code> → click <b>Reload</b> on WhatHappened</li>
                    <li>If the issue persists, clear extension storage via DevTools</li>
                </ol>
            </div>`;
    }
}

bootstrap();

// Async Header: When a manual target is set, clear stale header badges.
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

    // Clear stale badges immediately — triage resolvers will repopulate
    clearWhoisFields();

    // Trigger silent background triage if auto-triage is enabled
    const autoTriage = await getConfig("auto-triage");
    if (autoTriage) {
        retryEmptyHeaderFields(domain, toApex(domain), { registrar: null, ns: null, webhost: null, ip: null, myip: null, geo: null, ssl: null, cdn: null, mx: null, dns: null });
    }

    // Sync content-block shield state for new domain
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) updateBlockState(tabs[0].url);
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
