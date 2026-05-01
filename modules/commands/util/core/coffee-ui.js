/**
 * @module modules/commands/util/core/coffee-ui.js
 * @description Helpers for the Pomodoro coffee timer.
 */
import { ANSI } from "../../../formatter.js";

const STEAM = [
    [`    ${ANSI.dim}   (  )  (  ${ANSI.reset}`,
     `    ${ANSI.dim}    )  (  ) ${ANSI.reset}`,
     `    ${ANSI.dim}   (  )  (  ${ANSI.reset}`],
    [`    ${ANSI.dim}    )  (  ) ${ANSI.reset}`,
     `    ${ANSI.dim}   (  )  (  ${ANSI.reset}`,
     `    ${ANSI.dim}    )  (  ) ${ANSI.reset}`],
];

export function getCup(level, steamFrame) {
    const C = ANSI.yellow;     
    const L = ANSI.cyan;       
    const D = ANSI.dim;        
    const R = ANSI.reset;

    const fill = [
        level <= 0 ? `${L}~~~~~~~~${R}` : `${D}        ${R}`,
        level <= 1 ? `${L}~~~~~~~~${R}` : `${D}        ${R}`,
        level <= 2 ? `${L}~~~~~~~~${R}` : `${D}        ${R}`,
        level <= 3 ? `${L}~~~~~~~~${R}` : `${D}        ${R}`,
    ];

    const steam = level <= 2 ? STEAM[steamFrame] : ["", "", ""];

    return [
        steam[0],
        steam[1],
        steam[2],
        `    ${C}┌──────────┐${R}`,
        `    ${C}│${R} ${fill[0]} ${C}│${R}${C}\\${R}`,
        `    ${C}│${R} ${fill[1]} ${C}│${R} ${C}│${R}`,
        `    ${C}│${R} ${fill[2]} ${C}│${R} ${C}│${R}`,
        `    ${C}│${R} ${fill[3]} ${C}│${R}${C}/${R}`,
        `    ${C}└──────────┘${R}`,
        `    ${C}  ══════════${R}`,
    ];
}

export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getPomodoroTip(minutes) {
    if (minutes <= 5) return "Micro-break: Rest your eyes, stretch.";
    if (minutes <= 10) return "Short break: Walk, hydrate, breathe.";
    if (minutes <= 15) return "Medium break: Snack, fresh air.";
    return "Pomodoro session: Deep focus time.";
}

export function startAlarmChime() {
    let stopped = false;
    let ctx = null;

    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return { stop() {} };
        ctx = new AC();
    } catch (_) {
        return { stop() {} };
    }

    const ready = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    let loopTimeout = null;

    function playChime() {
        if (stopped) return;
        try {
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(523.25, now);
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc1.start(now);
            osc1.stop(now + 0.3);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(659.25, now + 0.15);
            gain2.gain.setValueAtTime(0.001, now);
            gain2.gain.setValueAtTime(0.15, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.45);

            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.type = "sine";
            osc3.frequency.setValueAtTime(783.99, now + 0.3);
            gain3.gain.setValueAtTime(0.001, now);
            gain3.gain.setValueAtTime(0.15, now + 0.3);
            gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc3.start(now + 0.3);
            osc3.stop(now + 0.6);
        } catch (_) {}

        loopTimeout = setTimeout(playChime, 2500);
    }

    ready.then(playChime).catch(() => {});

    return {
        stop() {
            stopped = true;
            clearTimeout(loopTimeout);
            try { ctx.close(); } catch (_) {}
        }
    };
}

export function startFlash() {
    const el = document.querySelector(".xterm");
    if (!el) return { stop() {} };

    let on = false;
    const flashInterval = setInterval(() => {
        on = !on;
        el.style.outline = on ? "3px solid #ffcc00" : "";
        el.style.backgroundColor = on ? "rgba(255, 204, 0, 0.06)" : "";
    }, 500);

    return {
        stop() {
            clearInterval(flashInterval);
            el.style.outline = "";
            el.style.backgroundColor = "";
        }
    };
}
