import { ANSI, insights, resolveTargetDomain, toRegisteredDomain, cmdUsage, workerError, cmdError } from "../../formatter.js";

// ===================================================================
//  whois
// ===================================================================

function extractRegistrar(entities) {
    if (!entities?.length) return "Unknown";
    for (const e of entities) {
        if (!e.roles?.includes("registrar")) continue;
        if (e.vcardArray?.[1]) {
            for (const p of e.vcardArray[1]) {
                if (p[0] === "fn" && p[3]) return p[3];
            }
        }
        if (e.handle) return e.handle;
    }
    return "Unknown";
}

export async function cmdWhois(args, flags = []) {
    const info = {};
    const raw = resolveTargetDomain(args[0], info);
    if (!raw) return cmdUsage("whois", "<domain>");
    const domain = toRegisteredDomain(raw);
    const isShort = flags.includes("--short");

    const resp = await chrome.runtime.sendMessage({command:"whois",payload:{domain}});
    if (!resp) return workerError();
    if (resp.error?.includes("404")) return cmdError(`No RDAP data for '${domain}'\n${ANSI.dim}Registry may not support RDAP.`);
    if (resp.error) return cmdError(resp.error);

    const d = resp.data;

    // --short mode: compact Registrar + Expiry only (for auto-whois)
    if (isShort) {
        let o = "";
        // Extract registrar name
        let registrar = extractRegistrar(d.entities);
        // Extract expiry
        const expE = d.events?.find(e => e.eventAction === "expiration");
        if (expE) {
            const dd = Math.floor((new Date(expE.eventDate) - new Date()) / 864e5);
            const ec = dd < 0 ? ANSI.red : dd < 30 ? ANSI.yellow : ANSI.green;
            const label = dd < 0 ? `EXPIRED ${Math.abs(dd)}d ago` : `${dd}d remaining`;
            o += `  ${ANSI.white}Registrar:${ANSI.reset} ${registrar}\n`;
            o += `  ${ANSI.white}Expiry:${ANSI.reset}    ${ec}${expE.eventDate.slice(0, 10)}${ANSI.reset} ${ANSI.dim}(${label})${ANSI.reset}`;
        } else {
            o += `  ${ANSI.white}Registrar:${ANSI.reset} ${registrar}\n`;
            o += `  ${ANSI.white}Expiry:${ANSI.reset}    ${ANSI.dim}Not available${ANSI.reset}`;
        }
        return o;
    }

    let o = "";
    o += `> whois ${domain}\n`;

    o += `Domain Name: ${(d.ldhName||domain).toUpperCase()}\n`;
    if (d.handle) o += `${ANSI.white}Registry Domain ID: ${ANSI.reset}${d.handle}\n`;
    if (d.status?.length) for (const s of d.status) { const c=s.includes("delete")||s.includes("redemption")?ANSI.red:s.includes("hold")?ANSI.yellow:ANSI.green; o+=`${ANSI.white}Domain Status: ${c}${s}${ANSI.reset}\n`; }
    if (d.nameservers?.length) for (const ns of d.nameservers) o+=`${ANSI.white}Name Server: ${ANSI.cyan}${(ns.ldhName||ns).toUpperCase()}${ANSI.reset}\n`;
    if (d.events?.length) for (const ev of d.events) {
        if (ev.eventAction==="registration") o+=`${ANSI.white}Creation Date: ${ANSI.green}${ev.eventDate}${ANSI.reset}\n`;
        else if (ev.eventAction==="expiration") o+=`${ANSI.white}Expiry Date: ${ANSI.reset}${ev.eventDate}\n`;
        else if (ev.eventAction==="last changed") o+=`${ANSI.white}Updated Date: ${ANSI.reset}${ev.eventDate}\n`;
    }
    if (d.entities?.length) for (const e of d.entities) {
        const roles=(e.roles||[]).join(", "); let name=e.handle||"N/A";
        if (e.vcardArray?.[1]) for (const p of e.vcardArray[1]) { if(p[0]==="fn") name=p[3]||name; }
        o+=`${ANSI.white}${roles.charAt(0).toUpperCase()+roles.slice(1)}: ${ANSI.reset}${name}\n`;
    }

    const ins = [];
    const expE = d.events?.find(e=>e.eventAction==="expiration");
    if (expE) { const dd=Math.floor((new Date(expE.eventDate)-new Date())/864e5); if(dd<0)ins.push({level:"CRIT",text:`Expired ${Math.abs(dd)} days ago.`});else if(dd<30)ins.push({level:"CRIT",text:`Expires in ${dd} days.`});else if(dd<90)ins.push({level:"WARN",text:`Expires in ${dd} days.`});else ins.push({level:"PASS",text:`Expires in ${dd} days.`}); }
    const regE = d.events?.find(e=>e.eventAction==="registration");
    if (regE) { const dd=Math.floor((new Date()-new Date(regE.eventDate))/864e5); const y=Math.floor(dd/365); if(dd<90)ins.push({level:"WARN",text:`Only ${dd} days old. Low trust.`}); else ins.push({level:"INFO",text:`Age: ${y}y (${dd}d). ${y>=2?"Established.":"Building reputation."}`}); }

    ins.push({level:"INFO",text:`Test WHOIS: https://www.whois.com/whois/${domain}`});

    o += insights(ins);
    return o;
}
