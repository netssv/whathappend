import { ANSI } from "../../formatter.js";

export async function cmdSession(args) {
    if (!args || args.length === 0) {
        return `${ANSI.red}Usage: session <id | list | close id>${ANSI.reset}`;
    }

    const { TerminalMultiplexer } = await import("../../terminal/terminal-multiplexer.js");
    const sub = args[0].toLowerCase();

    if (sub === "list") {
        let output = `${ANSI.dim}Multiplexer Sessions:${ANSI.reset}\n`;
        for (const s of TerminalMultiplexer.sessions) {
            const isActive = s === TerminalMultiplexer.activeSession ? ` ${ANSI.green}*${ANSI.reset} ` : "   ";
            const domain = s.domain || "Idle";
            output += `${isActive}Session ${s.id}  -  ${domain}\n`;
        }
        return output;
    }

    if (sub === "close") {
        const id = parseInt(args[1], 10);
        if (isNaN(id)) return `${ANSI.red}[ERROR] Invalid session ID${ANSI.reset}`;
        const session = TerminalMultiplexer.sessions.find(s => s.id === id);
        if (!session) return `${ANSI.red}[ERROR] Session ${id} not found${ANSI.reset}`;
        if (TerminalMultiplexer.sessions.length === 1) return `${ANSI.red}[ERROR] Cannot close last session${ANSI.reset}`;
        
        TerminalMultiplexer.closeSession(session);
        return `${ANSI.green}[OK]${ANSI.reset} Closed session ${id}`;
    }

    const id = parseInt(sub, 10);
    if (isNaN(id)) return `${ANSI.red}[ERROR] Invalid command or ID${ANSI.reset}`;

    const session = TerminalMultiplexer.sessions.find(s => s.id === id);
    if (!session) return `${ANSI.red}[ERROR] Session ${id} not found${ANSI.reset}`;

    await TerminalMultiplexer.switchToSession(session);
    return `${ANSI.green}[OK]${ANSI.reset} Switched to session ${id}`;
}
