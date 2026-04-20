import { ContextManager } from "./modules/context.js";
import { executeCommand } from "./modules/engine.js";
import { pushHistory } from "./modules/state.js";
import { initTerminalUI, showBanner, writePrompt, writeOutput, term } from "./modules/terminal/terminal-ui.js";
import { initHeaderController } from "./modules/terminal/header-controller.js";
import { initInputManager, isCommandProcessing } from "./modules/terminal/input/index.js";
import { InputEvents } from "./modules/terminal/input/events.js";
import { setKeyboardLock } from "./modules/terminal/input/keyboard-events.js";

// ---------------------------------------------------------------------------
// Bootstrapping
// ---------------------------------------------------------------------------

async function bootstrap() {
    // 1. Setup the terminal UI visually
    await initTerminalUI("terminal-container");

    // 2. Setup the header logic
    initHeaderController(term);

    // 3. Setup the input manager (keyboard, paste, execution)
    initInputManager();

    // 4. Show initial prompt
    showBanner();

    // 5. Context Manager Init + Initial Auto-Analysis Prompt
    const initialDomain = await ContextManager.init();
    if (initialDomain) {
        setKeyboardLock(true);
        term.write(`\x1b[33m?\x1b[0m Run auto-analysis on \x1b[36m${initialDomain}\x1b[0m? [Y/n] `);

        const disposable = term.onKey(({ key, domEvent }) => {
            const k = key.toLowerCase();
            // Ignore modifier keys and multi-char keys (except enter/esc)
            if (k.length > 1 && domEvent.keyCode !== 13 && domEvent.keyCode !== 27) return;

            if (k === 'y' || domEvent.keyCode === 13) { // Y or Enter
                term.write(domEvent.keyCode === 13 ? "Y\r\n" : "y\r\n");
                disposable.dispose();
                setKeyboardLock(false);

                writePrompt();
                term.write(initialDomain + "\r\n");
                InputEvents.emit(InputEvents.EV_COMMAND_SUBMIT, initialDomain);
            } else { // N, Esc, or any other key defaults to No
                term.write((domEvent.keyCode === 27 ? "N" : key) + "\r\n");
                disposable.dispose();
                setKeyboardLock(false);
                writePrompt();
            }
        });
    } else {
        writePrompt();
    }

    // 6. Ensure terminal captures keyboard focus (deferred to ensure Side Panel is fully ready)
    setTimeout(() => {
        window.focus();
        const textarea = document.querySelector('.xterm-helper-textarea');
        if (textarea) textarea.focus();
        term.focus();
    }, 150);
}

bootstrap();



// Auto-Whois: When a manual target is set, run a short whois lookup
ContextManager.onTargetChanged(async (domain) => {
    if (!domain || isCommandProcessing()) return;

    term.write("\r\n");
    term.writeln(`\x1b[90m── Auto-WHOIS: ${domain} ──\x1b[0m`);

    try {
        // executeCommand does not manage isProcessing here, 
        // but inputManager protects against concurrent typing
        const output = await executeCommand(`whois ${domain} --short`);
        if (output && output !== "__CLEAR__") {
            writeOutput(output);
            pushHistory({
                timestamp: new Date().toISOString(),
                command: `[auto] whois ${domain} --short`,
                output: output,
            });
        }
    } catch (err) {
        term.writeln(`\x1b[31m[ERROR] Auto-WHOIS failed: ${err.message}\x1b[0m`);
    }

    writePrompt();
});
