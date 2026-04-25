import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory, restoreSession, setSessionTarget, setSessionTriad } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, term } from "./modules/terminal/terminal-ui.js";
import { initHeaderController, updateWhoisFields, updateNSField, updateHostField, clearWhoisFields, showTabSwitch, hideTabSwitch } from "./modules/terminal/header-controller.js";
import { initInputManager, isCommandProcessing } from "./modules/terminal/input/index.js";
import { InputEvents } from "./modules/terminal/input/events.js";
import { setKeyboardLock } from "./modules/terminal/input/keyboard-events.js";

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

async function bootstrap() {
    // 1. Setup the terminal UI visually
    await initTerminalUI("terminal-container");

    // 2. Setup the header logic
    initHeaderController(term);

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
    } else if (initialDomain) {
        setKeyboardLock(true);
        // Automatically start the progressive triage for the active tab
        writePrompt();
        term.write(initialDomain + "\r\n");
        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, initialDomain);
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



// Async WHOIS: When a manual target is set, fire-and-forget a WHOIS lookup
// directly to the background handler and update the header bar with pre-parsed fields.
// The terminal prompt is NOT blocked.
ContextManager.onTargetChanged((domain) => {
    if (!domain || isIPAddress(domain)) return;

    // Hide any pending tab-switch notification (user already switched)
    hideTabSwitch();

    // Persist target for session restore
    setSessionTarget(domain);

    // Clear stale badges immediately
    clearWhoisFields();

    // Resolve apex domain for RDAP (subdomains cause 404)
    const apexDomain = toApex(domain);

    // 1. Fetch Registrar (Apex Domain)
    chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } })
        .then(resp => {
            if (resp?.success) {
                const reg = resp.registrar || null;
                updateWhoisFields(reg, `https://www.whois.com/whois/${apexDomain}`);
                setSessionTriad("registrar", reg);
            }
        }).catch(() => {});

    // 2. Fetch NameServers (Original Domain) — IP-based resolution
    chrome.runtime.sendMessage({ command: "dns", payload: { domain: domain, type: "NS" } })
        .then(resp => {
            const nsRecords = resp?.data?.Answer?.filter(a => a.type === 2);
            if (nsRecords && nsRecords.length > 0) {
                const nsHost = nsRecords[0].data.replace(/\.$/, "");
                const targetRoot = domain.split(".").slice(-2).join(".");
                const nsRoot = nsHost.split(".").slice(-2).join(".");
                const nsUrl = `https://intodns.com/${domain}`;

                if (nsRoot === targetRoot) {
                    updateNSField(`Self-hosted (${targetRoot})`, nsUrl);
                    setSessionTriad("ns", `Self-hosted (${targetRoot})`);
                } else {
                    // Resolve NS hostname IP → ip-whois for actual operator
                    chrome.runtime.sendMessage({ command: "dns", payload: { domain: nsHost, type: "A" } })
                        .then(nsAResp => {
                            const nsA = nsAResp?.data?.Answer?.find(a => a.type === 1);
                            if (nsA?.data) {
                                chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip: nsA.data } })
                                    .then(ipResp => {
                                        const provider = ipResp?.success && ipResp.org ? ipResp.org : nsHost;
                                        updateNSField(provider, nsUrl);
                                        setSessionTriad("ns", provider);
                                    }).catch(() => { updateNSField(nsHost, nsUrl); setSessionTriad("ns", nsHost); });
                            } else {
                                // Fallback: capitalize domain root
                                const fb = nsRoot.split(".")[0];
                                const label = fb.charAt(0).toUpperCase() + fb.slice(1);
                                updateNSField(label, nsUrl);
                                setSessionTriad("ns", label);
                            }
                        }).catch(() => { updateNSField(nsHost, nsUrl); setSessionTriad("ns", nsHost); });
                }
            }
        }).catch(() => {});

    // 3. Fetch Web Host (A -> IP -> RDAP)
    chrome.runtime.sendMessage({ command: "dns", payload: { domain: domain, type: "A" } })
        .then(resp => {
            const aRecord = resp?.data?.Answer?.find(a => a.type === 1);
            if (aRecord && aRecord.data) {
                const ip = aRecord.data;
                chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip } })
                    .then(ipResp => {
                        if (ipResp?.success && ipResp.org) {
                            updateHostField(ipResp.org, `https://ipinfo.io/${ip}`);
                            setSessionTriad("host", ipResp.org);
                        }
                    }).catch(() => {});
            }
        }).catch(() => {});
});

// Tab-change notification: Show interactive bar so user can choose to switch
ContextManager.onTabChanged((domain, prev) => {
    if (isCommandProcessing()) return;

    showTabSwitch(domain, (newDomain) => {
        // User clicked "Switch" — adopt the new domain and run triage
        ContextManager.setManualTarget(newDomain);
        writePrompt();
        term.write(newDomain + "\r\n");
        InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, newDomain);
    });
});
