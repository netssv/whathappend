import { ContextManager } from "./modules/context.js";
import { isIPAddress, toApex } from "./modules/formatter.js";
import { pushHistory } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, term } from "./modules/terminal/terminal-ui.js";
import { initHeaderController, updateWhoisFields, updateNSField, updateHostField, clearWhoisFields } from "./modules/terminal/header-controller.js";
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

    // 5. Context Manager Init + Initial Auto-Analysis
    const initialDomain = await ContextManager.init();
    if (initialDomain) {
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

    // Clear stale badges immediately
    clearWhoisFields();

    // Resolve apex domain for RDAP (subdomains cause 404)
    const apexDomain = toApex(domain);

    // 1. Fetch Registrar (Apex Domain)
    chrome.runtime.sendMessage({ command: "whois", payload: { domain: apexDomain } })
        .then(resp => {
            if (resp?.success) {
                updateWhoisFields(resp.registrar || null);
            }
        }).catch(() => {});

    // 2. Fetch NameServers (Original Domain)
    chrome.runtime.sendMessage({ command: "dns", payload: { domain: domain, type: "NS" } })
        .then(resp => {
            const nsRecords = resp?.data?.Answer?.filter(a => a.type === 2);
            if (nsRecords && nsRecords.length > 0) {
                const nsHost = nsRecords[0].data.replace(/\.$/, "");
                const targetRoot = domain.split(".").slice(-2).join(".");
                const nsRoot = nsHost.split(".").slice(-2).join(".");

                if (nsRoot === targetRoot) {
                    updateNSField(`Self-hosted (${targetRoot})`);
                } else {
                    // Quick RDAP lookup for NS provider
                    chrome.runtime.sendMessage({ command: "whois", payload: { domain: nsRoot } })
                        .then(nsResp => {
                            if (nsResp?.success && nsResp.data?.entities?.length) {
                                for (const e of nsResp.data.entities) {
                                    if (e.vcardArray?.[1]) {
                                        for (const p of e.vcardArray[1]) {
                                            if ((p[0] === "org" || p[0] === "fn") && p[3]) {
                                                updateNSField(p[3]);
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                            updateNSField(nsHost);
                        }).catch(() => { updateNSField(nsHost); });
                }
            }
        }).catch(() => {});

    // 3. Fetch Web Host (A -> IP -> RDAP)
    chrome.runtime.sendMessage({ command: "dns", payload: { domain: domain, type: "A" } })
        .then(resp => {
            const aRecord = resp?.data?.Answer?.find(a => a.type === 1);
            if (aRecord && aRecord.data) {
                chrome.runtime.sendMessage({ command: "ip-whois", payload: { ip: aRecord.data } })
                    .then(ipResp => {
                        if (ipResp?.success && ipResp.org) {
                            updateHostField(ipResp.org);
                        }
                    }).catch(() => {});
            }
        }).catch(() => {});
});

// Tab-change notification: When the browser active tab changes, show a discrete notice
ContextManager.onTabChanged((domain, prev) => {
    if (isCommandProcessing()) return;
    clearWhoisFields(); // Clear old badges on tab switch
    term.write("\r\n");
    term.writeln(`\x1b[90m── Tab changed → \x1b[36m${domain}\x1b[90m ──\x1b[0m`);
    writePrompt();
});
