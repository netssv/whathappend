/**
 * @module modules/commands/util/games/core/signal-game.js
 * @description OOP Core engine for the Signal Interception minigame.
 */

import { ANSI } from "../../../../formatter.js";
import { SIGNAL_LEVELS } from "../../../../data/signal-data.js";
import { SignalUI } from "./signal-ui.js";

export const DM  = "\x1b[38;2;30;80;55m";    // Dim    — grid/zero-line
export const RS  = ANSI.reset;

export const LOCK_NEED = 30;

export class SignalGame {
    constructor(term, doneCallback) {
        this.term = term;
        this.doneCallback = doneCallback;
        this.cols = term.cols || 80;
        this.rows = term.rows || 24;

        this.fL = 1;
        this.fR = this.cols - 2;
        this.fW = this.fR - this.fL;
        this.panelH = Math.max(5, Math.floor((this.rows - 8) / 2));
        this.tTop = 2;
        this.sep = this.tTop + this.panelH;
        this.pTop = this.sep + 2;
        this.hudRow = this.pTop + this.panelH + 1;
        this.legRow = this.hudRow + 1;

        this.AMP_STEP = 0.2;
        this.AMP_MIN = 1;
        this.AMP_MAX = this.panelH / 2 - 0.5;
        this.FREQ_STEP = 0.005;
        this.FREQ_MIN = 0.05;
        this.FREQ_MAX = 0.40;

        this.currentLevelIdx = 0;
        this.levelConfig = null;
        this.tAmp = 0; this.tFreq = 0;
        this.pAmp = 0; this.pFreq = 0;
        this.phase = 0;
        this.matchPct = 0;
        this.lockTicks = 0;
        this.levelWon = false;
        this.gameWon = false;
        this.animTick = 0;

        this.intervalId = null;
        this.onDataDisposable = null;

        // Decoupled renderer
        this.ui = new SignalUI(this.term, this);
    }

    start() {
        this.term.write("\x1b[2J\x1b[H\x1b[?25l");
        this.loadLevel(0);
        this.onDataDisposable = this.term.onData(this.handleInput.bind(this));
        this.tick();
        this.intervalId = setInterval(this.tick.bind(this), 100);
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.onDataDisposable) this.onDataDisposable.dispose();
        if (this.term) {
            this.term.write("\x1b[?25h");
            this.term.write(`\n\n  ${DM}[Signal lost]${RS}\n`);
        }
    }

    loadLevel(idx) {
        this.currentLevelIdx = idx;
        this.levelConfig = SIGNAL_LEVELS[idx];
        const T_AMPS  = [2, 3, 4, 5];
        const T_FREQS = [0.10, 0.15, 0.20, 0.25, 0.30];

        this.tAmp = this.levelConfig.amp === "rand" ? T_AMPS[Math.floor(Math.random() * T_AMPS.length)] : this.levelConfig.amp;
        this.tFreq = this.levelConfig.freq === "rand" ? T_FREQS[Math.floor(Math.random() * T_FREQS.length)] : this.levelConfig.freq;

        this.pAmp = this.levelConfig.ampLock ? this.tAmp : Math.max(this.AMP_MIN, Math.min(this.AMP_MAX, this.tAmp + (Math.random() < 0.5 ? -1.6 : 1.6)));
        this.pFreq = this.levelConfig.freqLock ? this.tFreq : Math.max(this.FREQ_MIN, Math.min(this.FREQ_MAX, this.tFreq + (Math.random() < 0.5 ? -0.06 : 0.06)));

        this.phase = 0;
        this.matchPct = 0;
        this.lockTicks = 0;
        this.levelWon = false;
    }

    calcMatch() {
        const tC = this.tTop + Math.floor(this.panelH / 2);
        let totalDiff = 0;
        for (let i = 0; i < this.fW; i++) {
            const ty = tC - Math.round(this.tAmp * Math.sin(this.tFreq * i - this.phase));
            const py = tC - Math.round(this.pAmp * Math.sin(this.pFreq * i - this.phase));
            totalDiff += Math.abs(ty - py);
        }
        return Math.max(0, Math.round((1 - totalDiff / (this.fW * this.panelH)) * 100));
    }

    handleInput(e) {
        if (e === "q" || e === "Q" || e === "\x03") { this.doneCallback(); return; }
        if (this.gameWon) return;

        if (this.levelWon && e === " ") {
            this.loadLevel(this.currentLevelIdx + 1);
            return;
        }

        if (!this.levelWon && !this.gameWon) {
            if (!this.levelConfig.ampLock) {
                if (e === "\x1b[A") this.pAmp = Math.min(this.AMP_MAX, +(this.pAmp + this.AMP_STEP).toFixed(1));
                if (e === "\x1b[B") this.pAmp = Math.max(this.AMP_MIN, +(this.pAmp - this.AMP_STEP).toFixed(1));
            }
            if (!this.levelConfig.freqLock) {
                if (e === "\x1b[C") this.pFreq = Math.min(this.FREQ_MAX, +(this.pFreq + this.FREQ_STEP).toFixed(3));
                if (e === "\x1b[D") this.pFreq = Math.max(this.FREQ_MIN, +(this.pFreq - this.FREQ_STEP).toFixed(3));
            }
        }
    }

    tick() {
        this.animTick++;
        this.phase += 0.08;

        if (!this.levelWon && !this.gameWon) {
            this.matchPct = this.calcMatch();
            if (this.matchPct >= this.levelConfig.winPct) {
                this.lockTicks++;
                if (this.lockTicks >= LOCK_NEED) {
                    this.levelWon = true;
                    if (this.currentLevelIdx >= SIGNAL_LEVELS.length - 1) {
                        this.gameWon = true;
                    }
                }
            } else {
                this.lockTicks = Math.max(0, this.lockTicks - 2);
            }
        }

        this.ui.render();
    }
}
