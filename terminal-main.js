import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory, restoreSession, setSessionTarget } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, term } from "./modules/terminal/terminal-ui.js";
import { initHeaderController, updateWhoisFields, updateNSField, updateHostField, clearWhoisFields, showTabSwitch, hideTabSwitch, initBlockPanel, updateBlockState, initLogoMenu } from "./modules/terminal/header-controller.js";
import { initInputManager } from "./modules/terminal/input/index.js";
import { InputEvents } from "./modules/terminal/input/events.js";
import { setKeyboardLock } from "./modules/terminal/input/keyboard-events.js";
import { getConfig } from "./modules/commands/util/config.js";
import { retryEmptyHeaderFields } from "./modules/core/triage-retries.js";

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

async function bootstrap() {
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

    if (session.target && session.history.length > 0) {
        // Resume previous session — replay history + restore target
        ContextManager.setManualTarget(session.target);

        // Restore header triad immediately (no re-fetch needed)
        if (session.triad) {
            const domain = session.target;
            const apex = toApex(domain);
            if (session.triad.registrar) updateWhoisFields(session.triad.registrar, `https://www.whois.com/whois/${apex}`);
            if (session.triad.ns) updateNSField(session.triad.ns, `https://intodns.com/${domain}`);
            if (session.triad.host) updateHostField(session.triad.host, `https://ipinfo.io/${domain}`);
        }

        // Replay saved command/output pairs into the terminal
        for (const entry of session.history) {
            if (entry.command) {
                term.writeln(`\x1b[90m~\x1b[0m`);
                term.writeln(`\x1b[35m❯\x1b[0m ${entry.command}`);
            }
            if (entry.output) {
                const lines = entry.output.split("\n");
                for (const line of lines) {
                    term.writeln(line);
                }
            }
        }

        term.writeln(`\x1b[90m── Session restored (${session.history.length} cmd) → \x1b[36m${session.target}\x1b[90m ──\x1b[0m`);
        writePrompt();

        // If active tab differs from restored target, suggest switching
        if (initialDomain && toApex(initialDomain) !== toApex(session.target)) {
            showTabSwitch(initialDomain, (newDomain) => {
                ContextManager.setManualTarget(newDomain);
                writePrompt();
                term.write(newDomain + "\r\n");
                InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, newDomain);
            });
        }
    } else if (session.target) {
        // Target exists but no history
        ContextManager.setManualTarget(session.target);
        if (session.triad) {
            const domain = session.target;
            const apex = toApex(domain);
            if (session.triad.registrar) updateWhoisFields(session.triad.registrar, `https://www.whois.com/whois/${apex}`);
            if (session.triad.ns) updateNSField(session.triad.ns, `https://intodns.com/${domain}`);
            if (session.triad.host) updateHostField(session.triad.host, `https://ipinfo.io/${domain}`);
        }
        term.writeln(`\x1b[90m── Session restored → \x1b[36m${session.target}\x1b[90m ──\x1b[0m`);
        writePrompt();

        // If active tab differs from restored target, suggest switching
        if (initialDomain && toApex(initialDomain) !== toApex(session.target)) {
            showTabSwitch(initialDomain, (newDomain) => {
                ContextManager.setManualTarget(newDomain);
                writePrompt();
                term.write(newDomain + "\r\n");
                InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, newDomain);
            });
        }
    } else if (initialDomain) {
        // Test de inicio eliminado (no auto-start terminal output).
        // Pero sí disparamos la recolección de triada silenciosa si auto-triage está activo.
        writePrompt();
        
        const autoTriage = await getConfig("auto-triage");
        if (autoTriage) {
            ContextManager.setManualTarget(initialDomain);
        }
    } else {
        writePrompt();
    }

    // 6. Ensure terminal captures keyboard focus (deferred to ensure Side Panel is fully ready)
    setTimeout(() => {
        window.focus();
        const textarea = document.querySelector('.xterm-helper-textarea');
        if (textarea) textarea.focus();
        term.focus();
    }, 150);
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
        retryEmptyHeaderFields(domain, toApex(domain), { registrar: null, ns: null, webhost: null });
    }

    // Sync content-block shield state for new domain
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) updateBlockState(tabs[0].url);
});

// Tab-change notification: Show interactive bar so user can choose to switch
ContextManager.onTabChanged((domain, prev) => {
    // Don't suggest switching if the new domain matches the current target
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
