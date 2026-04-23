import { ANSI, insights, resolveTargetDomain, isIPAddress, cmdUsage, cmdError, workerError } from "../../formatter.js";
import { resolveProvider } from "../../utils.js";

// ===================================================================
//  hosting — A record → IP → RDAP provider detection
// ===================================================================

export async function cmdHosting(args) {
    const info = {};
    const domain = resolveTargetDomain(args[0], info);
    if (!domain) return cmdUsage("hosting", "<domain>");

    // If the user passed an IP directly, resolve it
    if (isIPAddress(domain)) {
        return await resolveAndFormat(domain, domain);
    }

    // Resolve A record to get the IP
    const aResp = await chrome.runtime.sendMessage({
        command: "dns",
        payload: { domain, type: "A" }
    });

    const aRecord = aResp?.data?.Answer?.find(r => r.type === 1);
    if (!aRecord?.data) {
        return cmdError(`No A record found for ${domain}.\n${ANSI.dim}The domain may not have a web server configured.${ANSI.reset}`);
    }

    const ip = aRecord.data.trim();
    return await resolveAndFormat(ip, domain);
}

async function resolveAndFormat(ip, domain) {
    let o = `> hosting ${domain}\n`;
    o += `${ANSI.white}IP:${ANSI.reset}         ${ip}\n`;

    const provider = await resolveProvider(ip);
    if (provider) {
        o += `${ANSI.white}Provider:${ANSI.reset}   ${ANSI.cyan}${provider}${ANSI.reset}\n`;
    } else {
        o += `${ANSI.white}Provider:${ANSI.reset}   ${ANSI.dim}Unknown${ANSI.reset}\n`;
    }

    const ins = [];
    if (provider) {
        ins.push({ level: "INFO", text: `Hosted by ${provider}.` });
    } else {
        ins.push({ level: "WARN", text: "Could not determine hosting provider via RDAP." });
        ins.push({ level: "INFO", text: `Manual lookup: https://www.whois.com/whois/${ip}` });
    }
    ins.push({ level: "INFO", text: `IP WHOIS: https://rdap.org/ip/${ip}` });

    o += insights(ins);
    return o;
}
