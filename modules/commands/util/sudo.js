/**
 * @module modules/commands/util/sudo.js
 * @description Joke command for sudo.
 */
import { ANSI } from "../../formatter.js";
import { ContextManager } from "../../context.js";

export function cmdSudo() {
    if (ContextManager.isPrivileged()) {
        return `${ANSI.green}[OK] You are already in privileged mode.${ANSI.reset}`;
    }
    
    // In a real scenario, this would trigger an interactive prompt or auth flow.
    // For now, we simulate unlocking privileged capabilities immediately.
    ContextManager.setPrivileged(true);
    return `\n  ${ANSI.yellow}${ANSI.bold}[WARNING] Privileged Mode Enabled${ANSI.reset} \n  You now have access to high-impact commands (e.g., blocking scripts, cookie deletion).\n  ${ANSI.dim}With great power comes great responsibility.${ANSI.reset}\n`;
}
