/**
 * @module modules/data/themes/theme-wh-ui.js
 * @description WH UI — Clean macOS-inspired dashboard aesthetic.
 * 
 * Warm dark grays (not pure black), subtle blue undertones,
 * refined accent palette, and softer contrast.
 */

export const themeWHUI = {
    name: "WH UI",
    accent: "#88c0d0",
    css: {
        /* Oceanic dark grays / blues */
        "--bg-main": "#2b353b",
        "--bg-panel": "#333f46",
        "--bg-panel-border": "#3c4a52",
        "--bg-active": "#242d32",
        "--bg-active-border": "#43555e",
        "--bg-active-pulse": "#2a363d",
        /* Input & Interactive */
        "--bg-input-focus": "#3c4a52",
        "--bg-btn": "#3c4a52",
        "--bg-btn-hover": "#4a5a63",
        "--bg-btn-active": "#2b353b",
        "--bg-scrollbar-thumb": "#4c566a",
        "--bg-scrollbar-thumb-hover": "#81a1c1",
        "--bg-scrollbar-thumb-active": "#88c0d0",
        /* Text — softer contrast on oceanic background */
        "--text-dim": "#8ea1ab",
        "--text-light": "#9aa7ad",
        "--text-bright": "#eceff4",
        "--text-dark": "#6f7e88",
        "--text-btn": "#eceff4",
        /* Accent palette (Nord inspired) */
        "--accent-green": "#a3be8c",
        "--accent-green-alpha": "rgba(163, 190, 140, 0.4)",
        "--accent-green-alpha-light": "rgba(163, 190, 140, 0.2)",
        "--accent-green-glow": "rgba(163, 190, 140, 0.4)",
        "--accent-green-selection": "rgba(163, 190, 140, 0.18)",
        "--accent-green-shadow-light": "rgba(163, 190, 140, 0.04)",
        "--accent-green-shadow-med": "rgba(163, 190, 140, 0.12)",
        "--accent-green-shadow-heavy": "rgba(163, 190, 140, 0.22)",
        "--accent-yellow": "#ebcb8b",
        "--accent-yellow-alpha": "rgba(235, 203, 139, 0.3)",
        "--accent-yellow-glow": "rgba(235, 203, 139, 0.5)",
    },
    xterm: {
        background: "#2b353b",
        foreground: "#eceff4",
        cursor: "#88c0d0",
        cursorAccent: "#2b353b",
        selectionBackground: "rgba(136, 192, 208, 0.22)",
        black: "#3b4252",
        red: "#bf616a",
        green: "#a3be8c",
        yellow: "#ebcb8b",
        blue: "#81a1c1",
        magenta: "#b48ead",
        cyan: "#88c0d0",
        white: "#e5e9f0",
        brightBlack: "#8190a0",
        brightRed: "#d08770",
        brightGreen: "#8fbcbb",
        brightYellow: "#ebcb8b",
        brightBlue: "#81a1c1",
        brightMagenta: "#b48ead",
        brightCyan: "#8fbcbb",
        brightWhite: "#eceff4",
    },
};
