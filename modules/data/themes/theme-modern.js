/**
 * @module modules/data/themes/theme-modern.js
 * @description Modern UI — Clean macOS-inspired dashboard aesthetic.
 * 
 * Warm dark grays (not pure black), subtle blue undertones,
 * refined accent palette, and softer contrast.
 */

export const themeModern = {
    name: "Modern UI",
    accent: "#00ffa3",
    css: {
        /* Warm dark grays — macOS-inspired, not pure black */
        "--bg-main": "#1c1c1e",
        "--bg-panel": "#2c2c2e",
        "--bg-panel-border": "#3a3a3c",
        "--bg-active": "#1e2822",
        "--bg-active-border": "#2a4a36",
        "--bg-active-pulse": "#1e3028",
        /* Input & Interactive */
        "--bg-input-focus": "#38383a",
        "--bg-btn": "#38383a",
        "--bg-btn-hover": "#48484a",
        "--bg-btn-active": "#2c2c2e",
        "--bg-scrollbar-thumb": "#48484a",
        "--bg-scrollbar-thumb-hover": "#636366",
        "--bg-scrollbar-thumb-active": "#8e8e93",
        /* Text — higher contrast on warm gray */
        "--text-dim": "#8e8e93",
        "--text-light": "#aeaeb2",
        "--text-bright": "#f2f2f7",
        "--text-dark": "#636366",
        "--text-btn": "#aeaeb2",
        /* Accent palette */
        "--accent-green": "#30d158",
        "--accent-green-alpha": "#30d15866",
        "--accent-green-alpha-light": "#30d15844",
        "--accent-green-glow": "rgba(48, 209, 88, 0.4)",
        "--accent-green-selection": "rgba(48, 209, 88, 0.18)",
        "--accent-green-shadow-light": "rgba(48, 209, 88, 0.04)",
        "--accent-green-shadow-med": "rgba(48, 209, 88, 0.12)",
        "--accent-green-shadow-heavy": "rgba(48, 209, 88, 0.22)",
        "--accent-yellow": "#ffd60a",
        "--accent-yellow-alpha": "#ffd60a33",
        "--accent-yellow-glow": "rgba(255, 214, 10, 0.5)",
    },
    xterm: {
        background: "#1c1c1e",
        foreground: "#f2f2f7",
        cursor: "#30d158",
        cursorAccent: "#1c1c1e",
        selectionBackground: "rgba(48, 209, 88, 0.22)",
        black: "#1c1c1e",
        red: "#ff453a",
        green: "#30d158",
        yellow: "#ffd60a",
        blue: "#0a84ff",
        magenta: "#bf5af2",
        cyan: "#64d2ff",
        white: "#f2f2f7",
        brightBlack: "#636366",
        brightRed: "#ff6961",
        brightGreen: "#4bdf72",
        brightYellow: "#ffe040",
        brightBlue: "#409cff",
        brightMagenta: "#da8fff",
        brightCyan: "#86e1ff",
        brightWhite: "#ffffff",
    },
};
