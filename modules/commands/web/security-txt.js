import { ANSI, insights, resolveTargetDomain, cmdUsage, cmdError, workerError } from "../../formatter.js";

// ===================================================================
//  security-txt — RFC 9116 Security Contact Discovery
//
//  Fetches /.well-known/security.txt (with legacy /security.txt
//  fallback) and displays parsed contact, policy, and encryption
//  fields from the target domain.
// ===================================================================

export async function cmdSecurityTxt(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("security-txt", "<domain>");

    let o = `> curl -s https://${domain}/.well-known/security.txt\n`;
    o += `${ANSI.dim}Checking RFC 9116 security contact...${ANSI.reset}\n\n`;

    const text = await fetchSecurityTxt(domain);
    if (!text) return o + noFileOutput(domain);

    return o + parseAndFormat(text, domain);
}

// ── Fetch with fallback ─────────────────────────────────────────────

async function fetchSecurityTxt(domain) {
    const urls = [
        `https://${domain}/.well-known/security.txt`,
        `https://${domain}/security.txt`,
    ];
    for (const url of urls) {
        try {
            const resp = await chrome.runtime.sendMessage({
                command: "fetch-text",
                payload: { url },
            });
            if (resp?.data?.text && resp.data.text.length > 10) {
                return resp.data.text;
            }
        } catch (_) {}
    }
    return null;
}

// ── Parse and format ────────────────────────────────────────────────

function parseAndFormat(text, domain) {
    const fields = parseFields(text);
    let o = "";

    const fieldMap = [
        ["Contact", "contact"],
        ["Expires", "expires"],
        ["Encryption", "encryption"],
        ["Policy", "policy"],
        ["Acknowledgments", "acknowledgments"],
        ["Preferred-Languages", "preferred-languages"],
        ["Canonical", "canonical"],
        ["Hiring", "hiring"],
    ];

    for (const [label, key] of fieldMap) {
        const vals = fields[key];
        if (!vals || vals.length === 0) continue;
        for (const v of vals) {
            o += `  ${ANSI.white}${label}:${ANSI.reset} ${ANSI.cyan}${v}${ANSI.reset}\n`;
        }
    }

    if (!o) return noFileOutput(domain);

    const ins = [];
    if (fields.contact?.length) ins.push({ level: "PASS", text: "Security contact is published (RFC 9116)." });
    else ins.push({ level: "WARN", text: "No Contact field found." });
    if (fields.expires?.length) ins.push({ level: "INFO", text: `Expires: ${fields.expires[0]}` });
    ins.push({ level: "INFO", text: `Reference: https://securitytxt.org/` });

    o += insights(ins);
    return o;
}

// ── Field parser ────────────────────────────────────────────────────

function parseFields(text) {
    const fields = {};
    for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx < 1) continue;
        const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const val = trimmed.slice(colonIdx + 1).trim();
        if (!fields[key]) fields[key] = [];
        fields[key].push(val);
    }
    return fields;
}

// ── No file found ───────────────────────────────────────────────────

function noFileOutput(domain) {
    const ins = [
        { level: "WARN", text: "No security.txt found." },
        { level: "INFO", text: "RFC 9116 recommends publishing /.well-known/security.txt" },
        { level: "INFO", text: `Generator: https://securitytxt.org/` },
    ];
    return `  ${ANSI.dim}No security.txt file found at either location.${ANSI.reset}\n` + insights(ins);
}
