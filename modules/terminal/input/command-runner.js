/**
 * @module modules/terminal/input/command-runner.js
 * @description Handles command execution, spinner lifecycle, and result rendering.
 *
 * Extracted from input/index.js to keep each module under 200 lines.
 */

import { InputEvents } from "./events.js";
import { setKeyboardLock } from "./keyboard-events.js";
import { translateRawCommand } from "./command-translator.js";
import { executeCommand } from "../../engine.js";
import { pushHistory } from "../../state.js";
import { term, writePrompt, showBanner, writeOutput, showSpinner, stopSpinner } from "../terminal-ui.js";

// ---------------------------------------------------------------------------
// Commands that show a spinner while running
// ---------------------------------------------------------------------------

const SPINNER_CMDS = new Set([
    "dig", "host", "nslookup", "curl", "openssl", "whois",
    "ping", "trace", "pixels",
    "email", "web", "sec", "ttl", "spf", "dmarc", "dkim", "robots",
    "a", "aaaa", "mx", "txt", "ns", "cname", "soa",
    "rev-dns", "port-scan", "ftp-check",
    "dns", "ssl", "headers", "redirect", "security",
    "http", "cert", "tls", "traceroute", "follow",
    "lookup", "scan", "audit", "mail", "domain",
    "latency", "sitemap", "record",
    "rdns", "ptr", "ports", "nmap", "portscan", "ftp",
    "tracking", "trackers", "pixel", "ads",
    "stack", "tech", "techstack", "wappalyzer", "cms",
    "registrar", "reg", "lifecycle",
    "hosting", "hoster", "provider", "webhost",
    "start", "run", "go", "begin", "analyze", "switch",
    "isup", "upcheck", "down", "downcheck", "status",
    "jitter", "latency-test",
    "speedtest", "bandwidth", "nettest",
    "flush", "clearcache", "clear-cache",
]);

// ---------------------------------------------------------------------------
// Shared mutable state — owned by input/index.js, referenced here via getters
// ---------------------------------------------------------------------------

let _currentAbortId = null;
let _isProcessing = false;
let _activeWatcher = null;

export function getAbortId()      { return _currentAbortId; }
export function setAbortId(v)     { _currentAbortId = v; }
export function getProcessing()   { return _isProcessing; }
export function setProcessing(v)  { _isProcessing = v; }
export function getWatcher()      { return _activeWatcher; }
export function setWatcher(v)     { _activeWatcher = v; }

// ---------------------------------------------------------------------------
// processCommand — the heavy execution pipeline
// ---------------------------------------------------------------------------

export async function processCommand(rawInput) {
    if (_isProcessing) {
        if (_activeWatcher) {
            _activeWatcher.stop(term);
            if (_activeWatcher.clearOnExit) {
                term.clear();
                showBanner();
            } else {
                term.writeln("\r\n\x1b[33m[Interrupted by new command]\x1b[0m");
            }
            _activeWatcher = null;
        }
        _currentAbortId = null;
        _isProcessing = false;
        setKeyboardLock(false);
    }

    let input = rawInput.trim().replace(/\\+$/, "").trim();
    if (input.startsWith("> ")) input = input.substring(2).trim();

    // Only translate the FIRST pipe segment — preserve the rest of the pipeline
    const pipeIndex = input.indexOf(" | ");
    const firstSegment = pipeIndex !== -1 ? input.slice(0, pipeIndex) : input;
    const restOfPipeline = pipeIndex !== -1 ? input.slice(pipeIndex) : "";

    const mappedFirst = translateRawCommand(firstSegment);
    const mappedInput = mappedFirst + restOfPipeline;
    if (mappedInput !== input) {
        term.writeln(`\r\x1b[90m> Translating raw command to: ${mappedFirst}${restOfPipeline}\x1b[0m`);
        input = mappedInput;
    }

    _isProcessing = true;
    setKeyboardLock(true);

    const myAbortId = `cmd-${Date.now()}`;
    _currentAbortId = myAbortId;

    const cmd = input.split(/\s+/)[0]?.toLowerCase();
    // For pipelines, check if the FIRST segment needs a spinner
    const pipelineFirstCmd = firstSegment.split(/\s+/)[0]?.toLowerCase();
    let spinnerInterval = SPINNER_CMDS.has(pipelineFirstCmd) || SPINNER_CMDS.has(cmd) ? showSpinner() : null;
    const _startTime = Date.now();

    try {
        const result = await executeCommand(input);

        if (spinnerInterval) { stopSpinner(spinnerInterval); spinnerInterval = null; }

        // Stale abort — a new command was started while this one was running
        if (_currentAbortId !== myAbortId) return;
        // Abort was triggered (Ctrl+C) while processing
        if (!_isProcessing && cmd !== "clear") return;

        // Progressive triage results
        if (result && typeof result === "object" && result.backgroundTriage !== undefined) {
            const historyOutput = result.output || "";
            if (historyOutput) {
                pushHistory({ timestamp: new Date().toISOString(), command: input, output: historyOutput });
            }
            if (result.chainedCommand) {
                _isProcessing = false;
                setKeyboardLock(false);
                setTimeout(() => InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, result.chainedCommand), 50);
                return;
            }
            // Start post-triage interactive hover/click watcher
            if (result.triageWatcher) {
                _activeWatcher = result.triageWatcher.watcher;
                const doneCallback = () => {
                    if (_activeWatcher) _activeWatcher.stop(term);
                    _activeWatcher = null;
                    _isProcessing = false;
                    setKeyboardLock(false);
                    writePrompt();
                };
                _activeWatcher.start(term, doneCallback);
                return;
            }
        } else {
            const output = result;
            if (output === "__CLEAR__") {
                term.clear();
                showBanner();
            } else if (output && typeof output === "object" && output.__watch) {
                _activeWatcher = output.watcher;
                const doneCallback = () => {
                    if (_activeWatcher) _activeWatcher.stop(term);
                    _activeWatcher = null;
                    _isProcessing = false;
                    setKeyboardLock(false);
                    writePrompt();
                };
                _activeWatcher.start(term, doneCallback);
                return; // Don't release lock or write prompt
            } else if (output) {
                const clean = output.replace(/\x1b\[[0-9;]*m/g, "").trim();
                if (clean !== "^C" && clean !== "Command cancelled.") {
                    writeOutput(output);
                    pushHistory({ timestamp: new Date().toISOString(), command: input, output });
                }
            }
        }
    } catch (err) {
        if (spinnerInterval) stopSpinner(spinnerInterval);
        if (_currentAbortId !== myAbortId) return;
        term.writeln(`\x1b[31m[FATAL] ${err.message}\x1b[0m`);
    }

    const _execMs = Date.now() - _startTime;
    _isProcessing = false;
    setKeyboardLock(false);
    writePrompt(_execMs);
}
