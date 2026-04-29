import { ANSI } from "../../formatter.js";

// ===================================================================
//  about — Philosophy and identity
// ===================================================================

export async function cmdAbout() {
  let publicIp = "Offline";
  try {
    const ipResp = await fetch("https://1.1.1.1/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
    const text = await ipResp.text();
    const match = text.match(/ip=([^\n]+)/);
    if (match) publicIp = match[1];
  } catch (e) { }

  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  return `
${ANSI.cyan}${ANSI.bold}
 ██╗    ██╗██╗  ██╗ █████╗ ████████╗
 ██║    ██║██║  ██║██╔══██╗╚══██╔══╝
 ██║ █╗ ██║███████║███████║   ██║   
 ██║███╗██║██╔══██║██╔══██║   ██║   
 ╚███╔███╔╝██║  ██║██║  ██║   ██║   
  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
${ANSI.reset}
  ${ANSI.bold}H A P P E N E D${ANSI.reset} v${version}
  ${ANSI.dim}Modular Infrastructure Terminal${ANSI.reset}

  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Atomic Architecture:${ANSI.reset}
    Single-purpose, decoupled tools.

  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Zero-Cloud Privacy:${ANSI.reset}
    100% local. No external tracking.

  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Heuristic Discovery:${ANSI.reset}
    Intelligent infrastructure inference.

  ${ANSI.dim}Repository:${ANSI.reset}
  https://github.com/netssv/whathappend

  ${ANSI.dim}Node IP:${ANSI.reset} ${ANSI.cyan}${publicIp}${ANSI.reset}

  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} to explore commands.${ANSI.reset}
`;
}
