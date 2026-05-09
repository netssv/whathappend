/**
 * @module modules/commands/util/sudo.js
 * @description Sudo privilege escalation — enables access to high-impact commands.
 *              Mirrors the Linux sudo UX: activate once per session to unlock
 *              restricted operations like cookie deletion, script blocking, etc.
 *
 * @connections
 * - Imports: ANSI from '../../formatter.js', ContextManager from '../../context.js',
 *            SUDO_COMMANDS from '../../core/sudo-guard.js'
 * - Exports: cmdSudo
 * - Layer: Commands (Util)
 */
import { ANSI } from "../../formatter.js";
import { ContextManager } from "../../context.js";
import { SUDO_COMMANDS } from "../../core/sudo-guard.js";

export function cmdSudo(args, flags) {
    // `sudo -l` / `sudo --list` / `sudo -list` — show which commands require sudo
    const allTokens = [...(args || []), ...(flags || [])];
    const wantsList = allTokens.some(t => t === "-l" || t === "--list" || t === "-list");

    if (wantsList) {
        const sorted = [...SUDO_COMMANDS].sort();
        const lines = [
            `${ANSI.bold}${ANSI.yellow}Privileged Commands${ANSI.reset}`,
            `${ANSI.dim}${"─".repeat(36)}${ANSI.reset}`,
        ];
        for (const cmd of sorted) {
            lines.push(`  ${ANSI.red}⚡${ANSI.reset} ${cmd}`);
        }
        lines.push(`${ANSI.dim}${"─".repeat(36)}${ANSI.reset}`);
        const status = ContextManager.isPrivileged()
            ? `${ANSI.green}●${ANSI.reset} ${ANSI.dim}Privileged mode: active${ANSI.reset}`
            : `${ANSI.red}●${ANSI.reset} ${ANSI.dim}Privileged mode: inactive${ANSI.reset}`;
        lines.push(`${status}  ${ANSI.dim}│${ANSI.reset}  ${ANSI.dim}${sorted.length} commands require sudo${ANSI.reset}`);
        return lines.join("\n");
    }

    // Already elevated
    if (ContextManager.isPrivileged()) {
        return `${ANSI.green}[OK]${ANSI.reset} ${ANSI.dim}You are already in privileged mode.${ANSI.reset}`;
    }

    // Elevate
    ContextManager.setPrivileged(true);
    return [
        "",
        `  ${ANSI.yellow}${ANSI.bold}[sudo] Privileged Mode Enabled${ANSI.reset}`,
        `  ${ANSI.dim}High-impact commands are now unlocked for this session.${ANSI.reset}`,
        `  ${ANSI.dim}Run ${ANSI.reset}${ANSI.yellow}sudo -l${ANSI.reset}${ANSI.dim} to see restricted commands.${ANSI.reset}`,
        "",
    ].join("\n");
}
