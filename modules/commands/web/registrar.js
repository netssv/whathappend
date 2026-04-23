import { ANSI, insights, resolveTargetDomain, toRegisteredDomain, isIPAddress, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { extractRegistrar, extractExpiry, extractRegistration } from "./whois-parser.js";

// ===================================================================
//  registrar — Domain lifecycle (Registrar, Created, Expiry, Age)
// ===================================================================

export async function cmdRegistrar(args) {
    const info = {};
    const raw = resolveTargetDomain(args[0], info);
    if (!raw) return cmdUsage("registrar", "<domain>");
    if (isIPAddress(raw)) {
        return cmdError("'registrar' requires a domain name, not an IP address.");
    }

    const domain = toRegisteredDomain(raw);
    const resp = await chrome.runtime.sendMessage({ command: "whois", payload: { domain } });
    if (!resp) return workerError();
    if (resp.error) {
        return cmdError(`WHOIS lookup failed for ${domain}\n${ANSI.dim}${resp.error}${ANSI.reset}`);
    }

    const d = resp.data;
    const registrar = extractRegistrar(d);
    const creationDate = extractRegistration(d);
    const expiryDate = extractExpiry(d);

    let o = `> registrar ${domain}\n`;
    o += `${ANSI.white}Registrar:${ANSI.reset}  ${registrar}\n`;

    if (creationDate) {
        o += `${ANSI.white}Created:${ANSI.reset}    ${ANSI.green}${creationDate.slice(0, 10)}${ANSI.reset}\n`;
    } else {
        o += `${ANSI.white}Created:${ANSI.reset}    ${ANSI.dim}Not available${ANSI.reset}\n`;
    }

    if (expiryDate) {
        const dd = daysUntil(expiryDate);
        const ec = dd < 0 ? ANSI.red : dd < 30 ? ANSI.yellow : ANSI.green;
        const label = dd < 0 ? `EXPIRED ${Math.abs(dd)}d ago` : `${dd}d remaining`;
        o += `${ANSI.white}Expires:${ANSI.reset}    ${ec}${expiryDate}${ANSI.reset} ${ANSI.dim}(${label})${ANSI.reset}\n`;
    } else {
        o += `${ANSI.white}Expires:${ANSI.reset}    ${ANSI.dim}Not available${ANSI.reset}\n`;
    }

    // ── Insights ──
    const ins = [];
    if (expiryDate) {
        const dd = daysUntil(expiryDate);
        if (dd < 0)       ins.push({ level: "CRIT", text: `Expired ${Math.abs(dd)} days ago.` });
        else if (dd < 30) ins.push({ level: "CRIT", text: `Expires in ${dd} days.` });
        else if (dd < 90) ins.push({ level: "WARN", text: `Expires in ${dd} days.` });
        else              ins.push({ level: "PASS", text: `Expires in ${dd} days.` });
    }

    if (creationDate) {
        const age = daysAgo(creationDate);
        const y = Math.floor(age / 365);
        if (age < 90) ins.push({ level: "WARN", text: `Only ${age} days old. Low trust.` });
        else ins.push({ level: "INFO", text: `Age: ${y}y (${age}d). ${y >= 2 ? "Established." : "Building reputation."}` });
    }

    ins.push({ level: "INFO", text: `Lookup: https://www.whois.com/whois/${domain}` });
    o += insights(ins);
    return o;
}

// ---------------------------------------------------------------------------
// Date Utilities
// ---------------------------------------------------------------------------

function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date()) / 864e5);
}

function daysAgo(dateStr) {
    return Math.floor((new Date() - new Date(dateStr)) / 864e5);
}
