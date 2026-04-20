import { InputEvents } from "./events.js";
import { isHeaderFocused } from "../header-controller.js";

export function initClipboardHandler() {
    // Layer 1: Direct listener on xterm's hidden textarea (most reliable)
    setTimeout(() => {
        const container = document.getElementById("terminal-container");
        if (!container) return;
        
        const xtermTextarea = container.querySelector(".xterm-helper-textarea");
        if (xtermTextarea) {
            xtermTextarea.addEventListener("paste", (e) => {
                if (isHeaderFocused()) return; // Let header handle its own paste
                e.preventDefault();
                e.stopPropagation();
                
                const text = e.clipboardData?.getData("text");
                if (text) {
                    processPastedText(text);
                }
            });
        }
    }, 100);

    // Layer 2: Single global paste handler with focus detection
    document.addEventListener("paste", (e) => {
        // If header input is focused → let browser handle native paste into <input>
        if (isHeaderFocused()) return;

        // Otherwise → pipe into terminal buffer
        e.preventDefault();
        const text = e.clipboardData?.getData("text");
        if (text) {
            processPastedText(text);
        }
    });

    // Provide a manual trigger for Ctrl+V keyboard fallback
    InputEvents.on("EV_TRIGGER_MANUAL_PASTE", () => {
        if (isHeaderFocused()) return;
        
        try {
            navigator.clipboard.readText().then((text) => {
                if (text) processPastedText(text);
            }).catch(() => {
                // Clipboard API denied — trigger fallback paste via execCommand
                triggerFallbackPaste();
            });
        } catch (_) {
            triggerFallbackPaste();
        }
    });
}

function triggerFallbackPaste() {
    const container = document.getElementById("terminal-container");
    if (!container) return;
    const textarea = container.querySelector(".xterm-helper-textarea");
    if (textarea) {
        textarea.focus();
        document.execCommand("paste");
    }
}

function processPastedText(text) {
    if (!text) return;
    // Sanitize: replace newlines with space, remove non-printable chars
    const clean = text.replace(/[\r\n]+/g, " ").replace(/[^\x20-\x7E]/g, "");
    if (!clean) return;
    
    InputEvents.emit(InputEvents.EV_PASTE_TEXT, clean);
}
