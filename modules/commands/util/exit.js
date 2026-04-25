import { ANSI } from "../../formatter.js";
import { clearSession } from "../../state.js";

// ===================================================================
// exit — Clear session and close terminal
// ===================================================================

export async function cmdExit() {
    await clearSession();
    setTimeout(() => {
        window.close();
    }, 800);
    return `${ANSI.yellow}Session cleared.${ANSI.reset}\n${ANSI.dim}Closing terminal...${ANSI.reset}`;
}
