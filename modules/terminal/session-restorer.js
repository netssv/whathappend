/**
 * @module modules/terminal/session-restorer.js
 * @description Logic for restoring visual terminal state from persisted session data.
 */

import { toApex } from "../formatter.js";
import { updateWhoisFields, updateNSField, updateHostField, updateIPField, updateMyIPField, updateGeoField, updateSSLField, updateCDNField, updateMXField, updateHttpField, showTabSwitch } from "./header-controller.js";
import { ContextManager } from "../context.js";
import { writePrompt, term } from "./terminal-ui.js";
import { InputEvents } from "./input/events.js";

export function restoreHeaderTriad(triad, domain) {
    if (!triad) return;
    const apex = toApex(domain);
    if (triad.http) updateHttpField(triad.http, `https://${domain}`);
    if (triad.registrar) updateWhoisFields(triad.registrar, `https://www.whois.com/whois/${apex}`);
    if (triad.ns) updateNSField(triad.ns, `https://intodns.com/${domain}`);
    if (triad.host) updateHostField(triad.host, `https://ipinfo.io/${domain}`);
    if (triad.ip) updateIPField(triad.ip);
    if (triad.myip) updateMyIPField(triad.myip);
    if (triad.geo) updateGeoField(triad.geo);
    if (triad.ssl) updateSSLField(triad.ssl, triad.sslDays);
    if (triad.cdn) updateCDNField(triad.cdn);
    if (triad.mx) updateMXField(triad.mx, `https://mxtoolbox.com/SuperTool.aspx?action=mx:${apex}`);
}

export function replayTerminalHistory(history) {
    for (const entry of history) {
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
}

export function handleSessionRestore(session, initialDomain) {
    if (session.target && session.history.length > 0) {
        // Resume previous session — replay history + restore target
        ContextManager.setManualTarget(session.target);
        restoreHeaderTriad(session.triad, session.target);
        replayTerminalHistory(session.history);

        term.writeln(`\x1b[90m── Session restored (${session.history.length} cmd) → \x1b[36m${session.target}\x1b[90m ──\x1b[0m`);
        writePrompt();

        suggestTabSwitchIfNeeded(initialDomain, session.target);
        return true;
    } else if (session.target) {
        // Target exists but no history
        ContextManager.setManualTarget(session.target);
        restoreHeaderTriad(session.triad, session.target);

        term.writeln(`\x1b[90m── Session restored → \x1b[36m${session.target}\x1b[90m ──\x1b[0m`);
        writePrompt();

        suggestTabSwitchIfNeeded(initialDomain, session.target);
        return true;
    }
    return false;
}

function suggestTabSwitchIfNeeded(initialDomain, sessionTarget) {
    // If active tab differs from restored target, suggest switching
    if (initialDomain && initialDomain !== "restricted" && toApex(initialDomain) !== toApex(sessionTarget)) {
        showTabSwitch(initialDomain, (newDomain) => {
            ContextManager.setManualTarget(newDomain);
            writePrompt();
            term.write(newDomain + "\r\n");
            InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, newDomain);
        });
    }
}
