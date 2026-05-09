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
import { TerminalMultiplexer } from "../terminal-multiplexer.js";

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
// Shared mutable state — bound to the active session
// ---------------------------------------------------------------------------

export function getAbortId()      { return TerminalMultiplexer.activeSession?._abortId || null; }
export function setAbortId(v)     { if (TerminalMultiplexer.activeSession) TerminalMultiplexer.activeSession._abortId = v; }
export function getProcessing()   { return TerminalMultiplexer.activeSession?._isProcessing || false; }
export function setProcessing(v)  { if (TerminalMultiplexer.activeSession) TerminalMultiplexer.activeSession._isProcessing = v; }
export function getWatcher()      { return TerminalMultiplexer.activeSession?._activeWatcher || null; }
export function setWatcher(v)     { if (TerminalMultiplexer.activeSession) TerminalMultiplexer.activeSession._activeWatcher = v; }
export function getCmdSession()   { return TerminalMultiplexer.activeSession; }

function _setActivity(session, state) {
    if (session) {
        TerminalMultiplexer.setSessionActivity(session, state);
    }
}

// ---------------------------------------------------------------------------
// processCommand — the heavy execution pipeline
// ---------------------------------------------------------------------------

export async function processCommand(rawInput) {
    const session = TerminalMultiplexer.activeSession;
    if (!session) return;

    if (session._isProcessing) {
        if (session._activeWatcher) {
            session._activeWatcher.stop(session.term);
            if (session._activeWatcher.clearOnExit) {
                session.term.clear();
            } else {
                session.term.writeln("\r\n\x1b[33m[Interrupted by new command]\x1b[0m");
            }
            session._activeWatcher = null;
        }
        // Reset the PREVIOUS session's activity before starting new command
        _setActivity(session, "idle");
        session._abortId = null;
        session._isProcessing = false;
        if (session === TerminalMultiplexer.activeSession) setKeyboardLock(false);
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
        session.term.writeln(`\r\x1b[90m> Translating raw command to: ${mappedFirst}${restOfPipeline}\x1b[0m`);
        input = mappedInput;
    }

    session._isProcessing = true;
    if (session === TerminalMultiplexer.activeSession) setKeyboardLock(true);
    _setActivity(session, "processing");

    const myAbortId = `cmd-${Date.now()}`;
    session._abortId = myAbortId;

    const cmd = input.split(/\s+/)[0]?.toLowerCase();
    // For pipelines, check if the FIRST segment needs a spinner
    const pipelineFirstCmd = firstSegment.split(/\s+/)[0]?.toLowerCase();
    let spinnerInterval = SPINNER_CMDS.has(pipelineFirstCmd) || SPINNER_CMDS.has(cmd) ? showSpinner() : null;
    const _startTime = Date.now();

    try {
        const result = await executeCommand(input);

        if (spinnerInterval) { stopSpinner(spinnerInterval); spinnerInterval = null; }

        // Stale abort — a new command was started while this one was running
        if (session._abortId !== myAbortId) return;
        // Abort was triggered (Ctrl+C) while processing
        if (!session._isProcessing && cmd !== "clear") return;

        // Progressive triage results
        if (result && typeof result === "object" && result.backgroundTriage !== undefined) {
            const historyOutput = result.output || "";
            if (historyOutput) {
                pushHistory({ timestamp: new Date().toISOString(), command: input, output: historyOutput });
            }
            if (result.chainedCommand) {
                session._isProcessing = false;
                if (session === TerminalMultiplexer.activeSession) setKeyboardLock(false);
                _setActivity(session, "idle");
                setTimeout(() => InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, result.chainedCommand), 50);
                return;
            }
            // Start post-triage interactive hover/click watcher
            if (result.triageWatcher) {
                session._activeWatcher = result.triageWatcher.watcher;
                _setActivity(session, "watching");
                const sessionTerm = session.term;  // real terminal, not Proxy
                const doneCallback = () => {
                    if (session._activeWatcher) session._activeWatcher.stop(sessionTerm);
                    session._activeWatcher = null;
                    session._isProcessing = false;
                    if (session === TerminalMultiplexer.activeSession) {
                        setKeyboardLock(false);
                        writePrompt();
                    }
                    _setActivity(session, "idle");
                };
                session._activeWatcher.start(sessionTerm, doneCallback);
                return;
            }
        } else {
            const output = result;
            if (output === "__CLEAR__") {
                session.term.clear();
            } else if (output && typeof output === "object" && output.__watch) {
                session._activeWatcher = output.watcher;
                _setActivity(session, "watching");
                const sessionTerm = session.term;  // real terminal, not Proxy
                const doneCallback = () => {
                    if (session._activeWatcher) session._activeWatcher.stop(sessionTerm);
                    session._activeWatcher = null;
                    session._isProcessing = false;
                    if (session === TerminalMultiplexer.activeSession) {
                        setKeyboardLock(false);
                        writePrompt();
                    }
                    _setActivity(session, "idle");
                };
                session._activeWatcher.start(sessionTerm, doneCallback);
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
        if (session._abortId !== myAbortId) return;
        _setActivity(session, "idle");
        session.term.writeln(`\x1b[31m[FATAL] ${err.message}\x1b[0m`);
    }

    const _execMs = Date.now() - _startTime;
    session._isProcessing = false;
    if (session === TerminalMultiplexer.activeSession) setKeyboardLock(false);
    _setActivity(session, "idle");
    if (session === TerminalMultiplexer.activeSession) writePrompt(_execMs);
}
