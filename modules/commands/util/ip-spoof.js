/**
 * @module modules/commands/util/ip-spoof.js
 * @description Header injection for Fake IP spoofing.
 */

import { ANSI } from "../../formatter.js";
import { setEmulation, clearEmulation } from "../../terminal/header/header-emulation.js";

export async function cmdIPSpoof(args) {
    const ip = args[0];
    
    if (!ip) {
        return `${ANSI.red}[ERROR] Missing IP address.${ANSI.reset}\n  ${ANSI.dim}Usage: ip-spoof <ip> | ip-spoof reset${ANSI.reset}`;
    }

    if (ip.toLowerCase() === "reset" || ip.toLowerCase() === "clear" || ip.toLowerCase() === "off") {
        await new Promise(r => chrome.runtime.sendMessage({ command: "ip-spoof", payload: { ip: null } }, r));
        clearEmulation("ipspoof");
        return `${ANSI.green}[OK]${ANSI.reset} IP Spoofing disabled.`;
    }

    // Basic IP validation (IPv4 or IPv6 loosely)
    const isValid = /^[\d\.:a-fA-F]+$/.test(ip);
    if (!isValid) {
         return `${ANSI.red}[ERROR] Invalid IP format.${ANSI.reset}`;
    }

    await new Promise(r => chrome.runtime.sendMessage({ command: "ip-spoof", payload: { ip } }, r));
    setEmulation("ipspoof", ip);

    let o = `\n${ANSI.green}[OK]${ANSI.reset} IP Spoofing active\n`;
    o += `  ${ANSI.dim}Injected IP${ANSI.reset} ${ANSI.cyan}${ip}${ANSI.reset}\n`;
    o += `\n${ANSI.dim}The following headers are now attached to all requests:${ANSI.reset}\n`;
    o += `  ${ANSI.dim}- X-Forwarded-For: ${ip}\n`;
    o += `  ${ANSI.dim}- Client-IP: ${ip}\n`;
    o += `  ${ANSI.dim}- True-Client-IP: ${ip}\n`;
    o += `  ${ANSI.dim}- X-Real-IP: ${ip}\n`;
    o += `\n${ANSI.yellow}[NOTE] This is a Header Injection technique, NOT a VPN.${ANSI.reset}\n`;
    o += `${ANSI.dim}Verify via external service: ${ANSI.white}https://browserleaks.com/ip${ANSI.reset}`;

    return o;
}
