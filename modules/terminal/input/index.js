import { InputEvents } from "./events.js";
import { initKeyboardEvents, setKeyboardLock, setLine } from "./keyboard-events.js";
import { initCommandHistory } from "./command-history.js";
import { initAutocompleteEngine } from "./autocomplete-engine.js";
import { initClipboardHandler } from "./clipboard-handler.js";
import { initContextParser } from "./context-parser.js";
import { translateRawCommand } from "./command-translator.js";

import { executeCommand } from "../../engine.js";
import { pushHistory } from "../../state.js";
import { term, writePrompt, showBanner, writeOutput, showSpinner, stopSpinner } from "../terminal-ui.js";

let isProcessing = false;
let currentAbortId = null;
let activeWatcher = null;  // live monitor (tabs watch)

export function initInputManager() {
    // 1. Initialize Sub-Modules
    initKeyboardEvents();
    initCommandHistory();
    initAutocompleteEngine();
    initClipboardHandler();
    initContextParser();

    // 2. Orchestrate Sub-Module Events
    InputEvents.on(InputEvents.EV_COMMAND_SUBMIT, async (input) => {
        if (!input || input.trim() === "") {
            // Empty Enter → standard terminal behavior (new prompt)
            writePrompt();
            return;
        }
        await processCommand(input);
    });

    InputEvents.on(InputEvents.EV_INTERRUPT, () => {
        // Stop any active live watcher first
        if (activeWatcher) {
            activeWatcher.stop();
            activeWatcher = null;
            isProcessing = false;
            setKeyboardLock(false);
            term.write("\r\n\x1b[33m^C [Stopped]\x1b[0m\r\n");
            writePrompt();
            return;
        }
        if (isProcessing) {
            // Send abort signal to background worker
            if (currentAbortId) {
                chrome.runtime.sendMessage({ command: "abort", payload: { abortId: currentAbortId } }).catch(() => {});
                currentAbortId = null;
            }
            isProcessing = false;
            setKeyboardLock(false);
            term.write("\r\n\x1b[33m^C [Interrupted]\x1b[0m\r\n");
            writePrompt();
        } else {
            term.write("^C\r\n");
            setLine("");
            writePrompt();
        }
    });
}

// ---------------------------------------------------------------------------
// Execution Engine (Process Command)
// ---------------------------------------------------------------------------

async function processCommand(rawInput) {
    let input = rawInput.trim().replace(/\\+$/, "").trim();
    if (input.startsWith("> ")) {
        input = input.substring(2).trim();
    }
    
    // ── Reverse Command Mapping (Educational Feedback Loop) ──
    const mappedInput = translateRawCommand(input);

    if (mappedInput !== input) {
        term.writeln(`\r\x1b[90m> Translating raw command to: ${mappedInput}\x1b[0m`);
        input = mappedInput;
    }

    isProcessing = true;
    setKeyboardLock(true);
    
    const myAbortId = `cmd-${Date.now()}`;
    currentAbortId = myAbortId;

    const spinnerCommands = [
        "dig", "host", "nslookup", "curl", "openssl", "whois",
        "ping", "trace", "pixels",
        "email", "web", "sec", "ttl", "spf", "dmarc", "dkim", "robots",
        "a", "aaaa", "mx", "txt", "ns", "cname", "soa",
        "rev-dns", "port-scan", "ftp-check",
        // aliases
        "dns", "ssl", "headers", "redirect", "security",
        "http", "cert", "tls", "traceroute", "follow",
        "lookup", "scan", "audit", "mail", "domain",
        "latency", "sitemap", "record",
        "rdns", "ptr", "ports", "nmap", "portscan", "ftp",
        "tracking", "trackers", "pixel", "ads",
        // tech stack
        "stack", "tech", "techstack", "wappalyzer", "cms",
        // registrar + hosting
        "registrar", "reg", "lifecycle",
        "hosting", "hoster", "provider", "webhost",
        // start / switch
        "start", "run", "go", "begin", "analyze", "switch",
        // network parity
        "isup", "upcheck", "down", "downcheck", "status",
        "speed", "jitter", "latency-test",
        "speedtest", "bandwidth", "nettest",
    ];
    
    const cmd = input.split(/\s+/)[0]?.toLowerCase();
    let spinnerInterval = null;

    if (spinnerCommands.includes(cmd)) {
        spinnerInterval = showSpinner();
    }

    try {
        const result = await executeCommand(input);

        if (spinnerInterval) {
            stopSpinner(spinnerInterval);
        }

        // Stale abort — a new command was started while this one was running
        if (currentAbortId !== myAbortId) {
            return;
        }

        // Abort was triggered (Ctrl+C) while processing
        if (!isProcessing && cmd !== "clear") {
            return;
        }

        // Progressive triage: output was already rendered directly to xterm
        // by the ProgressiveRenderer. We only need to log to history.
        if (result && typeof result === "object" && result.backgroundTriage !== undefined) {
            const historyOutput = result.output || "";
            if (historyOutput) {
                pushHistory({
                    timestamp: new Date().toISOString(),
                    command: input,
                    output: historyOutput,
                });
            }
            if (result.chainedCommand) {
                // Ensure we release the lock so the new command can process immediately
                isProcessing = false;
                setKeyboardLock(false);
                setTimeout(() => InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, result.chainedCommand), 50);
                return; // Early return to prevent normal cleanup from locking it again
            }
        } else {
            const output = result;
            if (output === "__CLEAR__") {
                term.clear();
                showBanner();
            } else if (output && typeof output === "object" && output.__watch) {
                // Live watcher mode — keep keyboard locked, start polling
                activeWatcher = output.watcher;
                activeWatcher.start(term);
                return; // Don't release lock or write prompt
            } else if (output) {
                // Don't ghost "Command cancelled." as a standalone output line
                const clean = output.replace(/\x1b\[[0-9;]*m/g, "").trim();
                if (clean === "^C" || clean === "Command cancelled.") {
                    // Already handled by Ctrl+C display — skip
                } else {
                    writeOutput(output);
                    pushHistory({
                        timestamp: new Date().toISOString(),
                        command: input,
                        output: output,
                    });
                }
            }
        }
    } catch (err) {
        if (spinnerInterval) {
            stopSpinner(spinnerInterval);
        }
        if (currentAbortId !== myAbortId) return;
        term.writeln(`\x1b[31m[FATAL] ${err.message}\x1b[0m`);
    }

    isProcessing = false;
    setKeyboardLock(false);
    writePrompt();
}

export function isCommandProcessing() {
    return isProcessing;
}
