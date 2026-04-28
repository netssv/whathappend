import { InputEvents } from "./events.js";
import { initKeyboardEvents, setKeyboardLock, setLine } from "./keyboard-events.js";
import { initCommandHistory } from "./command-history.js";
import { initAutocompleteEngine } from "./autocomplete-engine.js";
import { initClipboardHandler } from "./clipboard-handler.js";
import { initContextParser } from "./context-parser.js";

import { executeCommand } from "../../engine.js";
import { pushHistory } from "../../state.js";
import { term, writePrompt, showBanner, writeOutput, showSpinner, stopSpinner } from "../terminal-ui.js";

let isProcessing = false;
let currentAbortId = null;

export function initInputManager() {
    // 1. Initialize Sub-Modules
    initKeyboardEvents();
    initCommandHistory();
    initAutocompleteEngine();
    initClipboardHandler();
    initContextParser();

    // 2. Orchestrate Sub-Module Events
    InputEvents.on(InputEvents.EV_COMMAND_SUBMIT, async (input) => {
        if (!input) {
            // Empty Enter → quick-start analysis of active tab
            await processCommand("start");
            return;
        }
        await processCommand(input);
    });

    InputEvents.on(InputEvents.EV_INTERRUPT, () => {
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

    // When the autocomplete engine wants to show multiple options
    InputEvents.on("EV_PRINT_OPTIONS", (matches) => {
        term.write("\r\n");
        term.writeln("\x1b[90m" + matches.join("  ") + "\x1b[0m");
        writePrompt();
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
    const lowerInput = input.toLowerCase();
    let mappedInput = input;
    
    if (lowerInput.startsWith("ping -c 10 ") || lowerInput.startsWith("ping -c 4 ")) {
        const match = input.match(/ping -c (?:10|4) ([^\s]+)/);
        if (match) mappedInput = `speed ${match[1]}`;
    } else if (lowerInput.startsWith("curl -o /dev/null http://speedtest")) {
        const match = input.match(/(\d+)MB\.zip/);
        mappedInput = match ? `speedtest ${match[1]}` : "speedtest";
    } else if (lowerInput.startsWith("curl -w ") && lowerInput.includes("ttfb")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `load ${match[1]}`;
    } else if (lowerInput.startsWith("whois ") && lowerInput.includes("orgname")) {
        const match = input.match(/whois ([^\s]+)/);
        if (match) mappedInput = `hosting ${match[1]}`;
    } else if (lowerInput.startsWith("whois ") && lowerInput.includes("registrar")) {
        const match = input.match(/whois ([^\s]+)/);
        if (match) mappedInput = `registrar ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("set-cookie")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `cookies ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://api.thegreenwebfoundation.org")) {
        const match = input.match(/greencheck\/([^\s]+)/);
        if (match) mappedInput = `green ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s \"https://crt.sh")) {
        const match = input.match(/q=([^&]+)/);
        if (match) mappedInput = `history ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://") && lowerInput.includes("src|href")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `links ${match[1]}`;
    } else if (lowerInput.startsWith("curl -s https://") && lowerInput.includes("google-analytics")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `pixels ${match[1]}`;
    } else if (lowerInput.startsWith("nc -z -v -w2 ")) {
        const parts = input.split(" ");
        if (parts.length > 4) mappedInput = `port-scan ${parts[4]} ${parts.slice(5).join(" ").replace("...", "")}`;
    } else if (lowerInput.startsWith("nc -v -w5 ")) {
        const parts = input.split(" ");
        if (parts.length > 3) mappedInput = `ftp-check ${parts[3]}`;
    } else if (lowerInput.startsWith("for sel in ")) {
        const match = input.match(/\._domainkey\.([^\s]+)/);
        if (match) mappedInput = `dkim ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("wappalyzer")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `stack ${match[1]}`;
    } else if (lowerInput.startsWith("curl -i -s https://") && lowerInput.includes("head -n 1")) {
        const match = input.match(/https?:\/\/([^\s]+)/);
        if (match) mappedInput = `isup ${match[1]}`;
    } else if (lowerInput.startsWith("dig ") && lowerInput.includes("+short")) {
        const parts = lowerInput.split(" ");
        if (parts.length >= 3) {
            const domain = parts[1];
            const type = parts[2];
            if (["a", "aaaa", "mx", "txt", "ns", "cname", "soa"].includes(type)) {
                mappedInput = `${type} ${domain}`;
            }
        }
    }

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
