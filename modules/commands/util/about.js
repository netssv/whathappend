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
  ${ANSI.dim}Modular Web Audit Tool for Infrastructure Analysts${ANSI.reset}

  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Atomic Architecture:${ANSI.reset} Single-purpose, decoupled diagnostic modules.
  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Zero-Cloud Privacy:${ANSI.reset} 100% client-side. No tracking, no external correlation.
  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Heuristic Discovery Engine:${ANSI.reset} Intelligent inference over rigid databases.

  ${ANSI.dim}Project Repository:${ANSI.reset} https://github.com/netssv/whathappend
  ${ANSI.dim}Current Node IP:${ANSI.reset}    ${ANSI.cyan}${publicIp}${ANSI.reset}

  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} to explore commands or visit the repository.${ANSI.reset}
`;
}
