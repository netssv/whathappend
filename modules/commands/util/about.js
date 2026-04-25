import { ANSI } from "../../formatter.js";

// ===================================================================
//  about — Philosophy and identity
// ===================================================================

export function cmdAbout() {
    return `
${ANSI.cyan}${ANSI.bold}
 ██╗    ██╗██╗  ██╗ █████╗ ████████╗
 ██║    ██║██║  ██║██╔══██╗╚══██╔══╝
 ██║ █╗ ██║███████║███████║   ██║   
 ██║███╗██║██╔══██║██╔══██║   ██║   
 ╚███╔███╔╝██║  ██║██║  ██║   ██║   
  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
${ANSI.reset}
  ${ANSI.bold}H A P P E N E D${ANSI.reset} v2.3.1
  ${ANSI.dim}Modular Web Audit Tool for Infrastructure Analysts${ANSI.reset}

  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Atomic Architecture:${ANSI.reset} Single-purpose, decoupled diagnostic modules.
  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Zero-Cloud Privacy:${ANSI.reset} 100% client-side. No tracking, no external correlation.
  ${ANSI.cyan}•${ANSI.reset} ${ANSI.white}Heuristic Discovery Engine:${ANSI.reset} Intelligent inference over rigid databases.

  ${ANSI.dim}Type ${ANSI.white}help${ANSI.dim} to explore commands or visit the repository.${ANSI.reset}
`;
}
