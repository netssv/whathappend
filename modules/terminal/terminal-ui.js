import { setTermCols } from "../state.js";

// ---------------------------------------------------------------------------
// Terminal Configuration — WCAG AA Compliant Palette
// ---------------------------------------------------------------------------

const TERMINAL_THEME = {
    background: "#0a0a0a",
    foreground: "#d4d4d4",
    cursor: "#00ff88",
    cursorAccent: "#0a0a0a",
    selectionBackground: "rgba(0, 255, 136, 0.18)",

    black: "#0a0a0a",
    red: "#ff6b6b",
    green: "#00ff88",
    yellow: "#ffd866",
    blue: "#7aa2f7",
    magenta: "#d4a0ff",
    cyan: "#41d8e8",
    white: "#d4d4d4",

    brightBlack: "#737373",
    brightRed: "#ff8585",
    brightGreen: "#5cffaa",
    brightYellow: "#ffe08a",
    brightBlue: "#8fb4ff",
    brightMagenta: "#e0b8ff",
    brightCyan: "#6be5f0",
    brightWhite: "#ffffff",
};

export const PROMPT_PREFIX = "\x1b[36m~\x1b[0m\r\n";
export const PROMPT = "\x1b[35m❯\x1b[0m ";

export let term;
export let fitAddon;

export function initTerminalUI(containerId) {
    term = new window.Terminal({
        theme: TERMINAL_THEME,
        fontFamily: '"Source Code Pro", "Fira Code", "Cascadia Code", "Consolas", monospace',
        fontSize: 12,
        lineHeight: 1.3,
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 10000,
        allowTransparency: true,
        convertEol: true,
        wordSeparator: ` ()[]{}'\"`,
    });

    fitAddon = new window.FitAddon.FitAddon();
    const webLinksAddon = new window.WebLinksAddon.WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    const container = document.getElementById(containerId);
    term.open(container);

    window.addEventListener("resize", () => {
        fitAddon.fit();
        setTermCols(term.cols);
    });

    setupFontControls();

    return new Promise((resolve) => {
        setTimeout(() => {
            fitAddon.fit();
            setTermCols(term.cols);
            resolve();
        }, 50);
    });
}

// ---------------------------------------------------------------------------
// Font Size Controls — [−] [+]
// ---------------------------------------------------------------------------

const FONT_MIN = 10;
const FONT_MAX = 20;

function updateFontSize(delta) {
    if (!term) return;
    const current = term.options.fontSize || 12;
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, current + delta));
    if (next === current) return;
    
    term.options.fontSize = next;
    fitAddon.fit();
    setTermCols(term.cols);
    
    // Force full re-render to avoid layout ghosting
    term.refresh(0, term.rows - 1);
    term.focus();
    
    try { chrome.storage.local.set({ termFontSize: next }); } catch (_) {}
}

function setupFontControls() {
    // Restore saved font size
    try {
        chrome.storage.local.get("termFontSize", (result) => {
            if (result.termFontSize && result.termFontSize >= FONT_MIN && result.termFontSize <= FONT_MAX) {
                term.options.fontSize = result.termFontSize;
                fitAddon.fit();
                setTermCols(term.cols);
            }
        });
    } catch (_) {}

    document.getElementById("font-decrease")?.addEventListener("click", () => updateFontSize(-1));
    document.getElementById("font-increase")?.addEventListener("click", () => updateFontSize(1));
}

// ---------------------------------------------------------------------------
// UI Output Helpers
// ---------------------------------------------------------------------------

export function showBanner() {
    term.writeln("");
    const cols = term.cols || 80;
    
    if (cols >= 60) {
        // WIDE SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[90m│\x1b[0m Web Infrastructure Triage \x1b[90m│\x1b[0m \x1b[33mv2.0.0\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(50) + "\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m for commands \x1b[90m│\x1b[0m \x1b[37m?\x1b[90m quick help \x1b[90m│\x1b[0m \x1b[37mCtrl+C\x1b[90m cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33mDisclaimer: \x1b[90mThis extension provides fast, preliminary triage data.");
        term.writeln("  \x1b[90mIt relies on browser APIs and cannot replace certified audits.");
        term.writeln("  \x1b[90mAlways verify findings according to your internal security policies.\x1b[0m");
    } else if (cols >= 45) {
        // MEDIUM SCREEN
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.0.0\x1b[0m");
        term.writeln("  \x1b[90m" + "━".repeat(38) + "\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m \x1b[90m│\x1b[0m \x1b[37m?\x1b[90m quick \x1b[90m│\x1b[0m \x1b[37mCtrl+C\x1b[90m cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33mDisclaimer: \x1b[90mFast, preliminary triage data only.");
        term.writeln("  \x1b[90mRelies on browser APIs (no deep network scans).");
        term.writeln("  \x1b[90mVerify findings per internal security policies.\x1b[0m");
    } else {
        // NARROW SCREEN (Large fonts)
        term.writeln("  \x1b[1m\x1b[36mWhatHappened\x1b[0m \x1b[33mv2.0.0\x1b[0m");
        term.writeln("  \x1b[90m━━━━━━━━━━━━━━━\x1b[0m");
        term.writeln("  \x1b[90mType \x1b[37mhelp\x1b[90m or \x1b[37m?\x1b[90m");
        term.writeln("  \x1b[90mPress \x1b[37mCtrl+C\x1b[90m to cancel\x1b[0m");
        term.writeln("");
        term.writeln("  \x1b[33m[!] \x1b[90mPreliminary triage only.");
        term.writeln("  \x1b[33m[!] \x1b[90mBrowser API limitations.");
        term.writeln("  \x1b[33m[!] \x1b[90mVerify via internal policies.\x1b[0m");
    }
    
    term.writeln("");
}

export function writePrompt() {
    term.write(PROMPT_PREFIX + PROMPT);
}

export function writeOutput(output) {
    const lines = output.split("\n");
    for (const line of lines) {
        term.writeln(line);
    }
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function showSpinner() {
    const frames = ["|", "/", "-", "\\"];
    let i = 0;
    term.write(`\x1b[90m${frames[0]}\x1b[0m`);
    return setInterval(() => {
        i = (i + 1) % frames.length;
        term.write(`\x1b[1D\x1b[90m${frames[i]}\x1b[0m`);
    }, 120);
}

export function stopSpinner(interval) {
    clearInterval(interval);
    term.write("\x1b[1D \x1b[1D");
}
